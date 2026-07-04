'use strict';
const Folder = require('../models/Folder');
const File = require('../models/File');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// ── GET /api/folders ────────────────────────────────────────────
// List all folders for the authenticated user + file count & size per folder
const listFolders = asyncHandler(async (req, res) => {
  const folders = await Folder.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  if (folders.length === 0) {
    return success(res, { folders: [] });
  }

  // Safe backfill for any legacy files matching folder names
  try {
    for (const f of folders) {
      await File.updateMany(
        { owner: req.user.id, folder: f.name, folderId: null },
        { $set: { folderId: f._id } }
      );
    }
  } catch (err) {
    console.warn('[listFolders] Backfill warning:', err.message);
  }

  const folderIds = folders.map((f) => f._id);
  const objectIdFolderIds = folderIds.map((id) => new mongoose.Types.ObjectId(id));
  const stringFolderIds = folderIds.map((id) => id.toString());

  const counts = await File.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user.id),
        $or: [
          { folderId: { $in: objectIdFolderIds } },
          { folderId: { $in: stringFolderIds } },
        ],
      },
    },
    { $group: { _id: '$folderId', count: { $sum: 1 }, totalSize: { $sum: '$size' } } },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    if (c._id) {
      countMap[c._id.toString()] = c;
    }
  });

  const foldersWithCounts = folders.map((f) => ({
    ...f,
    fileCount: countMap[f._id.toString()]?.count || 0,
    totalSize: countMap[f._id.toString()]?.totalSize || 0,
  }));

  return success(res, { folders: foldersWithCounts });
});

// ── POST /api/folders ────────────────────────────────────────────
// Create a new folder
const createFolder = asyncHandler(async (req, res) => {
  const { name, color, icon, description } = req.body;

  const existingCount = await Folder.countDocuments({ owner: req.user.id });
  if (existingCount >= 50) {
    return error(res, 'Maximum 50 folders allowed', 400);
  }

  const existingName = await Folder.findOne({
    owner: req.user.id,
    name: name.trim(),
  });
  if (existingName) {
    return error(res, 'A folder with that name already exists', 409);
  }

  const folder = await Folder.create({
    owner: req.user.id,
    name: name.trim(),
    color: color || 'indigo',
    icon: icon || '📁',
    description: description?.trim() || '',
  });

  // Link any legacy files uploaded with folder name string
  await File.updateMany(
    { owner: req.user.id, folder: folder.name, folderId: null },
    { $set: { folderId: folder._id } }
  );

  return success(res, { folder }, 201);
});

// ── PATCH /api/folders/:id ───────────────────────────────────────
// Rename / update folder metadata
const updateFolder = asyncHandler(async (req, res) => {
  const { name, color, icon, description, coverFileId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return error(res, 'Invalid folder ID', 400);
  }

  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!folder) return error(res, 'Folder not found', 404);

  if (name) folder.name = name.trim();
  if (color) folder.color = color;
  if (icon) folder.icon = icon;
  if (description !== undefined) folder.description = description.trim();
  if (coverFileId !== undefined) folder.coverFileId = coverFileId;
  folder.updatedAt = new Date();

  await folder.save();
  return success(res, { folder });
});

// ── DELETE /api/folders/:id ──────────────────────────────────────
// Delete folder — files inside are NOT deleted, just moved to "All photos"
const deleteFolder = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return error(res, 'Invalid folder ID', 400);
  }

  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!folder) return error(res, 'Folder not found', 404);

  await File.updateMany(
    { owner: req.user.id, folderId: folder._id },
    { $set: { folderId: null } }
  );

  await folder.deleteOne();
  return success(res, { message: 'Folder deleted. Files moved to All photos.' });
});

// ── PATCH /api/folders/move-files ───────────────────────────────
// Move one or multiple files into a folder (or out to All photos)
const moveFiles = asyncHandler(async (req, res) => {
  const { fileIds, targetFolderId } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return error(res, 'fileIds array required', 400);
  }
  if (fileIds.length > 200) {
    return error(res, 'Maximum 200 files per move operation', 400);
  }

  let targetFolder = null;
  if (targetFolderId && mongoose.Types.ObjectId.isValid(targetFolderId)) {
    targetFolder = await Folder.findOne({ _id: targetFolderId, owner: req.user.id });
    if (!targetFolder) return error(res, 'Target folder not found', 404);
  }

  const validFileIds = fileIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const owned = await File.countDocuments({
    _id: { $in: validFileIds },
    owner: req.user.id,
  });

  if (owned !== validFileIds.length) {
    return error(res, 'Unauthorized: some files do not belong to you', 403);
  }

  await File.updateMany(
    { _id: { $in: validFileIds }, owner: req.user.id },
    { $set: { folderId: targetFolder ? targetFolder._id : null, folder: targetFolder ? targetFolder.name : '' } }
  );

  return success(res, {
    message: `${validFileIds.length} file${validFileIds.length > 1 ? 's' : ''} moved`,
    movedCount: validFileIds.length,
  });
});

module.exports = {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFiles,
};
