'use strict';
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Upload an encrypted buffer or file to Cloudinary.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} userId - User ID namespace
 * @param {string} sanitizedFilename - Safe filename
 * @param {object} options - Custom Cloudinary options
 * @returns {Promise<{publicId: string, secureUrl: string, bytes: number}>}
 */
const uploadEncryptedBuffer = (buffer, userId, sanitizedFilename, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vault/${userId}`,
        public_id: `${Date.now()}_${sanitizedFilename}`,
        resource_type: 'raw',
        type: 'authenticated',
        overwrite: false,
        invalidate: true,
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          bytes: result.bytes,
        });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Generate a time-limited signed URL for a private raw Cloudinary asset.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {number} expiresInSec - TTL in seconds (default 3600)
 * @returns {string} Signed URL
 */
const generateSignedUrl = (publicId, expiresInSec = 3600) => {
  if (!publicId) return '';
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
    secure: true,
  });
};

/**
 * Hard-delete a single asset from Cloudinary.
 * Validates publicId before deletion.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - Options override (resource_type, type)
 * @returns {Promise<object>} Cloudinary destroy response
 */
const destroyAsset = async (publicId, options = {}) => {
  if (!publicId || typeof publicId !== 'string') {
    throw new Error('Invalid public_id provided for deletion');
  }

  const defaultOptions = {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true,
    ...options,
  };

  return await cloudinary.uploader.destroy(publicId.trim(), defaultOptions);
};

// Aliases for destroyAsset
const deleteAsset = destroyAsset;
const deleteEncryptedBuffer = destroyAsset;

/**
 * Delete multiple assets in parallel using Promise.all().
 *
 * @param {string[]} publicIds - Array of Cloudinary public_ids
 * @param {object} options - Options override
 * @returns {Promise<object[]>} Array of destruction results
 */
const deleteMultipleAssets = async (publicIds = [], options = {}) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return [];
  }

  const validIds = publicIds.filter((id) => id && typeof id === 'string');
  return await Promise.all(validIds.map((id) => destroyAsset(id, options)));
};

/**
 * Delete all assets within a specific folder prefix.
 *
 * @param {string} folderPath - e.g. "vault/user_id_123"
 * @returns {Promise<object>} Cloudinary API delete response
 */
const deleteFolderAssets = async (folderPath) => {
  if (!folderPath) return null;
  return await cloudinary.api.delete_resources_by_prefix(folderPath, {
    resource_type: 'raw',
    type: 'authenticated',
  });
};

module.exports = {
  uploadEncryptedBuffer,
  generateSignedUrl,
  destroyAsset,
  deleteAsset,
  deleteEncryptedBuffer,
  deleteMultipleAssets,
  deleteFolderAssets,
};
