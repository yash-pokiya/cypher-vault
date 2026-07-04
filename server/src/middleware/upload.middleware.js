'use strict';
const multer = require('multer');
const { error } = require('../utils/response.util');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Memory storage — encrypted blob never touches disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  // No Content-Type filter: browsers sending FormData set a boundary-parameterized
  // multipart/form-data header that varies per request. Filtering by
  // 'application/octet-stream' would reject valid browser uploads.
  // Buffer non-empty check happens after multer processes the request (see below).
});

const singleEncryptedFile = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return error(res, 'File exceeds 50 MB limit', 413);
      return error(res, `Upload error: ${err.message}`, 400);
    }
    if (err) return error(res, 'Upload failed', 500);

    // Post-receipt buffer validation
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return error(res, 'No file received or file is empty', 400);
    }
    next();
  });
};

module.exports = { singleEncryptedFile };
