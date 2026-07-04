'use strict';
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true, maxlength: 100 },
    // plaintext size (bytes) — for UI display only, never used for decryption
    size: { type: Number, required: true, min: 0 },
    // actual encrypted blob size stored on Cloudinary
    encryptedSize: { type: Number, required: true, min: 0 },
    cloudinaryPublicId: { type: String, required: true },
    cloudinarySecureUrl: { type: String, required: true },
    // AES-KW wrapped file key — base64 encoded; server cannot decrypt this
    wrappedFileKey: { type: String, required: true },
    // GCM IV — base64 encoded 96-bit value; not secret, needed for decryption
    iv: { type: String, required: true },
    // PBKDF2 salt — base64 encoded 256-bit value per file
    salt: { type: String, required: true },
    keyAlgorithm: { type: String, default: 'AES-GCM', enum: ['AES-GCM'] },
    folder: { type: String, default: '', maxlength: 100 },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

fileSchema.index({ owner: 1, uploadedAt: -1 });
fileSchema.index({ owner: 1, filename: 'text' });

module.exports = mongoose.model('File', fileSchema);
