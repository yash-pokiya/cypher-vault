'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const File = require('../models/File');
const cloudinary = require('../config/cloudinary');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Helper for exponential backoff lockout calculation
function calculateLockoutDuration(attempts) {
  if (attempts >= 20) return 24 * 60 * 60 * 1000; // 24 hours
  if (attempts >= 15) return 30 * 60 * 1000;      // 30 minutes
  if (attempts >= 10) return 5 * 60 * 1000;       // 5 minutes
  if (attempts >= 5)  return 30 * 1000;           // 30 seconds
  return 0;
}

// ─── Get Profile ───────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return error(res, 'User not found', 404);

  return success(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    storageUsed: user.storageUsed,
    vaultPasswordSet: user.vaultPasswordSet,
    createdAt: user.createdAt,
  });
});

// ─── Storage Stats ─────────────────────────────────────────────────────────
const getStorageStats = asyncHandler(async (req, res) => {
  const [aggResult, usageResult] = await Promise.allSettled([
    File.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          fileCount: { $sum: 1 },
          totalEncryptedBytes: { $sum: '$encryptedSize' },
          totalPlaintextBytes: { $sum: '$size' },
          folders: { $addToSet: '$folder' },
        },
      },
    ]),
    cloudinary.api.usage(),
  ]);

  const db =
    aggResult.status === 'fulfilled' && aggResult.value[0]
      ? aggResult.value[0]
      : { fileCount: 0, totalEncryptedBytes: 0, totalPlaintextBytes: 0, folders: [] };

  const cloudStats =
    usageResult.status === 'fulfilled' && usageResult.value
      ? {
          storageUsedBytes:
            usageResult.value.storage?.usage ??
            usageResult.value.storage?.used_bytes ??
            0,
          storageLimitBytes:
            usageResult.value.storage?.limit ??
            usageResult.value.storage?.limit_bytes ??
            0,
          bandwidthUsedBytes:
            usageResult.value.bandwidth?.usage ??
            usageResult.value.bandwidth?.used_bytes ??
            0,
          bandwidthLimitBytes:
            usageResult.value.bandwidth?.limit ??
            usageResult.value.bandwidth?.limit_bytes ??
            0,
        }
      : null;

  return success(res, {
    fileCount: db.fileCount,
    totalEncryptedBytes: db.totalEncryptedBytes,
    totalPlaintextBytes: db.totalPlaintextBytes,
    folders: db.folders.filter(Boolean).sort(),
    cloudinary: cloudStats,
  });
});

// ─── Update Account Password ───────────────────────────────────────────────
const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) return error(res, 'User not found', 404);

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) return error(res, 'Current password is incorrect', 401);

  if (typeof user.storageUsed === 'number' && user.storageUsed < 0) {
    user.storageUsed = 0;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return success(res, { message: 'Password updated successfully' });
});

// ─── GET /api/profile/vault-status ─────────────────────────────────────────
// Returns vault status including server-side lockout state.
const getVaultStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('vaultPasswordSet vaultSalt vaultVerifier wrappedMasterKey keyVersion encryptionMetadata vaultUnlockSecurity');
  if (!user) return error(res, 'User not found', 404);

  const sec = user.vaultUnlockSecurity || {};
  let remainingSeconds = 0;
  let isLocked = false;

  if (sec.lockUntil && new Date(sec.lockUntil).getTime() > Date.now()) {
    remainingSeconds = Math.ceil((new Date(sec.lockUntil).getTime() - Date.now()) / 1000);
    isLocked = remainingSeconds > 0;
  }

  return success(res, {
    vaultPasswordSet: user.vaultPasswordSet,
    vaultSalt: user.vaultSalt,
    vaultVerifier: user.vaultVerifier,
    wrappedMasterKey: user.wrappedMasterKey,
    keyVersion: user.keyVersion,
    encryptionMetadata: user.encryptionMetadata,
    locked: isLocked,
    remainingSeconds,
    failedAttempts: sec.failedAttempts || 0,
  });
});

// ─── POST /api/profile/vault-failed-unlock ──────────────────────────────────
// Increments failed attempts and enforces server-side exponential backoff lockouts.
const reportFailedUnlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);

  const sec = user.vaultUnlockSecurity || { failedAttempts: 0 };
  const now = new Date();

  // If already locked out, return remaining time immediately without double-incrementing
  if (sec.lockUntil && new Date(sec.lockUntil).getTime() > now.getTime()) {
    const remainingSeconds = Math.ceil((new Date(sec.lockUntil).getTime() - now.getTime()) / 1000);
    return res.status(429).json({
      success: false,
      error: `Too many failed attempts. Wait ${remainingSeconds} seconds.`,
      locked: true,
      remainingSeconds,
      failedAttempts: sec.failedAttempts,
    });
  }

  const newFailedAttempts = (sec.failedAttempts || 0) + 1;
  const lockoutMs = calculateLockoutDuration(newFailedAttempts);
  let lockUntil = null;

  if (lockoutMs > 0) {
    lockUntil = new Date(now.getTime() + lockoutMs);
  }

  user.vaultUnlockSecurity = {
    failedAttempts: newFailedAttempts,
    lockUntil,
    lastFailedAttempt: now,
    lastSuccessfulUnlock: sec.lastSuccessfulUnlock || null,
  };

  await user.save();

  const remainingSeconds = lockUntil ? Math.ceil(lockoutMs / 1000) : 0;
  const isLocked = lockoutMs > 0;

  if (isLocked) {
    return res.status(429).json({
      success: false,
      error: `Too many failed attempts. Wait ${remainingSeconds} seconds.`,
      locked: true,
      remainingSeconds,
      failedAttempts: newFailedAttempts,
    });
  }

  return success(res, {
    locked: false,
    remainingSeconds: 0,
    failedAttempts: newFailedAttempts,
  });
});

// ─── POST /api/profile/vault-successful-unlock ──────────────────────────────
// Resets failed attempts and lockUntil on successful vault unlock.
const reportSuccessfulUnlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);

  user.vaultUnlockSecurity = {
    failedAttempts: 0,
    lockUntil: null,
    lastFailedAttempt: user.vaultUnlockSecurity?.lastFailedAttempt || null,
    lastSuccessfulUnlock: new Date(),
  };

  await user.save();

  return success(res, { success: true, message: 'Unlock status recorded' });
});

// ─── POST /api/profile/vault-setup ─────────────────────────────────────────
const setupVaultPassword = asyncHandler(async (req, res) => {
  const { vaultSalt, vaultVerifier, wrappedMasterKey, encryptionMetadata } = req.body;

  if (!vaultSalt || typeof vaultSalt !== 'string' || vaultSalt.length < 16 || vaultSalt.length > 128) {
    return error(res, 'Invalid vault salt', 400);
  }

  if (!wrappedMasterKey || typeof wrappedMasterKey !== 'string' || wrappedMasterKey.length < 16) {
    return error(res, 'Invalid wrapped master key', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  if (user.vaultPasswordSet) {
    return error(res, 'Vault password already configured. Use change vault password.', 400);
  }

  const now = new Date();
  await User.findByIdAndUpdate(req.user.id, {
    vaultSalt,
    vaultVerifier: vaultVerifier || null,
    wrappedMasterKey,
    vaultPasswordSet: true,
    keyVersion: 1,
    encryptionMetadata: {
      algorithm: encryptionMetadata?.algorithm || 'AES-KW',
      kdfIterations: encryptionMetadata?.kdfIterations || 600000,
      kdfHash: encryptionMetadata?.kdfHash || 'SHA-256',
      masterKeyAlg: encryptionMetadata?.masterKeyAlg || 'AES-KW',
      masterKeyLength: encryptionMetadata?.masterKeyLength || 256,
      createdAt: now,
      updatedAt: now,
    },
  });

  return success(res, { message: 'Vault password configured successfully' });
});

// ─── POST /api/profile/vault-migrate ───────────────────────────────────────
const migrateVault = asyncHandler(async (req, res) => {
  const { wrappedMasterKey, encryptionMetadata } = req.body;

  if (!wrappedMasterKey || typeof wrappedMasterKey !== 'string' || wrappedMasterKey.length < 16) {
    return error(res, 'Invalid wrapped master key', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);

  if (!user.vaultPasswordSet) {
    return error(res, 'Vault not set up yet', 400);
  }

  if (user.wrappedMasterKey) {
    return success(res, { message: 'Already migrated', migrated: false });
  }

  const now = new Date();
  await User.findByIdAndUpdate(req.user.id, {
    wrappedMasterKey,
    encryptionMetadata: {
      algorithm: encryptionMetadata?.algorithm || 'AES-KW',
      kdfIterations: encryptionMetadata?.kdfIterations || 600000,
      kdfHash: encryptionMetadata?.kdfHash || 'SHA-256',
      masterKeyAlg: encryptionMetadata?.masterKeyAlg || 'AES-KW',
      masterKeyLength: encryptionMetadata?.masterKeyLength || 256,
      createdAt: now,
      updatedAt: now,
    },
  });

  return success(res, { message: 'Vault migrated to envelope encryption', migrated: true });
});

// ─── PATCH /api/profile/vault-change ───────────────────────────────────────
const changeVaultPassword = asyncHandler(async (req, res) => {
  const { newVaultSalt, vaultVerifier, wrappedMasterKey, rewrappedKeys, encryptionMetadata } = req.body;

  if (!newVaultSalt || typeof newVaultSalt !== 'string' || newVaultSalt.length < 16 || newVaultSalt.length > 128) {
    return error(res, 'Invalid vault salt', 400);
  }

  if (!Array.isArray(rewrappedKeys) || rewrappedKeys.length > 500) {
    return error(res, 'Invalid rewrapped keys', 400);
  }

  if (rewrappedKeys.length > 0) {
    const fileIds = rewrappedKeys.map((k) => k.fileId);
    const ownedCount = await File.countDocuments({
      _id: { $in: fileIds },
      owner: req.user.id,
    });

    if (ownedCount !== fileIds.length) {
      return error(res, 'Unauthorized file access', 403);
    }

    const bulkOps = rewrappedKeys.map(({ fileId, wrappedFileKey, iv, salt }) => ({
      updateOne: {
        filter: { _id: fileId, owner: req.user.id },
        update: { $set: { wrappedFileKey, iv, salt } },
      },
    }));

    await File.bulkWrite(bulkOps);
  }

  const updateFields = {
    vaultSalt: newVaultSalt,
    vaultPasswordSet: true,
  };

  if (vaultVerifier) updateFields.vaultVerifier = vaultVerifier;

  if (wrappedMasterKey) {
    updateFields.wrappedMasterKey = wrappedMasterKey;
    updateFields['encryptionMetadata.updatedAt'] = new Date();
    if (encryptionMetadata?.kdfIterations) {
      updateFields['encryptionMetadata.kdfIterations'] = encryptionMetadata.kdfIterations;
    }
  }

  await User.findByIdAndUpdate(req.user.id, updateFields);

  return success(res, { message: 'Vault password changed successfully' });
});

module.exports = {
  getProfile,
  getStorageStats,
  updatePassword,
  getVaultStatus,
  reportFailedUnlock,
  reportSuccessfulUnlock,
  setupVaultPassword,
  changeVaultPassword,
  migrateVault,
};
