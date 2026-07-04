'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const File = require('../models/File');
const cloudinary = require('../config/cloudinary');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

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

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return success(res, { message: 'Password updated successfully' });
});

// ─── GET /api/profile/vault-status ─────────────────────────────────────────
const getVaultStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('vaultPasswordSet vaultSalt');
  if (!user) return error(res, 'User not found', 404);

  return success(res, {
    vaultPasswordSet: user.vaultPasswordSet,
    vaultSalt: user.vaultSalt,
  });
});

// ─── POST /api/profile/vault-setup ─────────────────────────────────────────
const setupVaultPassword = asyncHandler(async (req, res) => {
  const { vaultSalt } = req.body;

  if (!vaultSalt || typeof vaultSalt !== 'string' || vaultSalt.length < 16 || vaultSalt.length > 128) {
    return error(res, 'Invalid vault salt', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  if (user.vaultPasswordSet) {
    return error(res, 'Vault password already configured. Use change vault password.', 400);
  }

  await User.findByIdAndUpdate(req.user.id, {
    vaultSalt,
    vaultPasswordSet: true,
  });

  return success(res, { message: 'Vault password configured successfully' });
});

// ─── PATCH /api/profile/vault-change ───────────────────────────────────────
const changeVaultPassword = asyncHandler(async (req, res) => {
  const { newVaultSalt, rewrappedKeys } = req.body;

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

  await User.findByIdAndUpdate(req.user.id, { vaultSalt: newVaultSalt, vaultPasswordSet: true });

  return success(res, { message: 'Vault password changed successfully' });
});

module.exports = {
  getProfile,
  getStorageStats,
  updatePassword,
  getVaultStatus,
  setupVaultPassword,
  changeVaultPassword,
};
