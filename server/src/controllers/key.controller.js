'use strict';
const File = require('../models/File');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');

const MAX_BATCH = 500;

// ─── Batch Rewrap ──────────────────────────────────────────────────────────
// Called after password change. Browser has already:
//   1. Derived old MasterKey per file's salt → unwrapped each FileKey
//   2. Generated new salt per file → derived new MasterKey → re-wrapped FileKey
//   3. Sends: [{ fileId, newWrappedFileKey, newSalt }]
// Cloudinary blobs are UNCHANGED — only MongoDB metadata is updated here.
const batchRewrap = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return error(res, 'updates must be a non-empty array', 400);
  }
  if (updates.length > MAX_BATCH) {
    return error(res, `Batch size exceeds maximum of ${MAX_BATCH}`, 400);
  }

  // Field-level validation
  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    if (!u.fileId || !u.newWrappedFileKey || !u.newSalt) {
      return error(res, `Update[${i}] missing: fileId, newWrappedFileKey, newSalt`, 400);
    }
  }

  const fileIds = updates.map((u) => u.fileId);

  // Ownership check — verify ALL files belong to the requesting user before touching any
  const owned = await File.find({ _id: { $in: fileIds }, owner: req.user.id }).select('_id');
  const ownedSet = new Set(owned.map((f) => f._id.toString()));
  const unauthorized = fileIds.filter((id) => !ownedSet.has(id));
  if (unauthorized.length > 0) {
    return error(res, 'One or more files not found or not owned by you', 403);
  }

  // Bulk update — no Cloudinary calls, only MongoDB
  const bulkOps = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.fileId, owner: req.user.id },
      update: { $set: { wrappedFileKey: u.newWrappedFileKey, salt: u.newSalt } },
    },
  }));

  const result = await File.bulkWrite(bulkOps, { ordered: false });

  return success(res, { updated: result.modifiedCount, total: updates.length });
});

module.exports = { batchRewrap };
