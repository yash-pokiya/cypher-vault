'use strict';

const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const cloudinaryUtil = require('../utils/cloudinary.util');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Allow basic alphanumeric + safe symbols
const sanitizeFilename = (filename) =>
  String(filename)
    .replace(/[^a-zA-Z0-9._\- ]/g, '_')
    .substring(0, 255);

// ── Upload Handler ───────────────────────────────────────────────
// Receives encrypted .enc blob from browser (multer puts it in req.file.buffer)
// Server touches ONLY ciphertext. Plaintext never arrives here.
const upload = asyncHandler(async (req, res) => {
  const { wrappedFileKey, iv, salt, mimeType, filename, size, keyAlgorithm, folder, folderId } = req.body;

  if (!wrappedFileKey || !iv || !salt) {
    return error(res, 'Missing crypto fields: wrappedFileKey, iv, salt', 400);
  }
  if (!mimeType || !filename) {
    return error(res, 'mimeType and filename are required', 400);
  }

  const sanitizedFilename = sanitizeFilename(filename);
  const parsedSize = parseInt(size, 10);
  if (isNaN(parsedSize) || parsedSize < 0) {
    return error(res, 'Invalid size value', 400);
  }

  // Upload encrypted blob → Cloudinary (raw, authenticated)
  let cloudResult;
  try {
    cloudResult = await cloudinaryUtil.uploadEncryptedBuffer(
      req.file.buffer,
      req.user.id,
      sanitizedFilename + '.enc'
    );
  } catch (err) {
    console.error('[file.upload] Cloudinary error:', err.message);
    return error(res, 'Storage upload failed', 502);
  }

  let assignedFolderId = folderId && mongoose.Types.ObjectId.isValid(folderId) ? new mongoose.Types.ObjectId(folderId) : null;
  if (!assignedFolderId && folder) {
    const matchedFolder = await Folder.findOne({ owner: req.user.id, name: String(folder).trim() });
    if (matchedFolder) {
      assignedFolderId = matchedFolder._id;
    }
  }

  // Persist metadata (all crypto params) to MongoDB
  const file = await File.create({
    owner: req.user.id,
    filename: sanitizedFilename,
    mimeType,
    size: parsedSize,
    encryptedSize: cloudResult.bytes,
    cloudinaryPublicId: cloudResult.publicId,
    cloudinarySecureUrl: cloudResult.secureUrl,
    wrappedFileKey,
    iv,
    salt,
    keyAlgorithm: keyAlgorithm || 'AES-GCM',
    folder: folder ? String(folder).substring(0, 100) : '',
    folderId: assignedFolderId,
  });

  // Track storage used per user
  await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: cloudResult.bytes } });

  return success(
    res,
    {
      id: file._id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      folder: file.folder,
      folderId: file.folderId,
      uploadedAt: file.uploadedAt,
    },
    201
  );
});

// ── List Files ───────────────────────────────────────────────────
// Returns list of user's encrypted file records (with crypto params)
const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, folder, folderId } = req.query;

  const query = { owner: req.user.id };
  if (folderId === 'null') {
    query.folderId = null;
  } else if (folderId && folderId !== 'all') {
    if (mongoose.Types.ObjectId.isValid(folderId)) {
      const folderObjId = new mongoose.Types.ObjectId(folderId);
      const targetFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
      if (targetFolder) {
        query.$or = [
          { folderId: folderObjId },
          { folderId: folderId },
          { folder: targetFolder.name },
        ];
      } else {
        query.$or = [
          { folderId: folderObjId },
          { folderId: folderId },
        ];
      }
    } else {
      query.folder = folderId;
    }
  } else if (folder) {
    query.folder = folder;
  }

  if (search) {
    query.filename = { $regex: String(search), $options: 'i' };
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [files, total] = await Promise.all([
    File.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    File.countDocuments(query),
  ]);

  const sanitized = files.map((f) => ({
    _id: f._id,
    filename: f.filename,
    mimeType: f.mimeType,
    size: f.size,
    folder: f.folder,
    folderId: f.folderId,
    wrappedFileKey: f.wrappedFileKey,
    iv: f.iv,
    salt: f.salt,
    uploadedAt: f.uploadedAt,
  }));

  return success(res, {
    files: sanitized,
    pagination: {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parsedLimit),
    },
  });
});

// ── Get Single File (Include Signed Download URL) ────────────────
const getById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return error(res, 'Invalid file ID', 400);
  }

  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) {
    return error(res, 'File not found', 404);
  }

  // Generate signed Cloudinary URL (valid for 1 hour)
  const signedUrl = cloudinaryUtil.generateSignedUrl(file.cloudinaryPublicId);

  return success(res, {
    file: {
      _id: file._id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      folder: file.folder,
      folderId: file.folderId,
      wrappedFileKey: file.wrappedFileKey,
      iv: file.iv,
      salt: file.salt,
      keyAlgorithm: file.keyAlgorithm,
      uploadedAt: file.uploadedAt,
      signedUrl,
    },
  });
});

// ── Delete File ──────────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return error(res, 'Invalid file ID', 400);
  }

  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) {
    return error(res, 'File not found', 404);
  }

  // Delete blob from Cloudinary
  try {
    await cloudinaryUtil.deleteEncryptedBuffer(file.cloudinaryPublicId);
  } catch (err) {
    console.error('[file.remove] Cloudinary delete failed:', err.message);
  }

  // Decrement user's storage tracking
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { storageUsed: -file.encryptedSize },
  });

  await file.deleteOne();

  return success(res, { message: 'File deleted successfully' });
});

module.exports = { upload, list, getById, remove };
