'use strict';
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Upload an encrypted buffer to Cloudinary.
 *
 * resource_type:'raw'      → Cloudinary treats bytes as opaque, never infers image MIME
 * type:'authenticated'     → Asset requires signed URL; not publicly accessible
 * folder:vault/{userId}/   → Per-user namespace, no cross-user access
 *
 * @param {Buffer} buffer - Encrypted .enc blob (never plaintext)
 * @param {string} userId - Owner user ID for folder namespacing
 * @param {string} sanitizedFilename - Path-traversal-safe filename
 * @returns {Promise<{publicId:string, secureUrl:string, bytes:number}>}
 */
const uploadEncryptedBuffer = (buffer, userId, sanitizedFilename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vault/${userId}`,
        public_id: `${Date.now()}_${sanitizedFilename}`,
        resource_type: 'raw',
        type: 'authenticated',
        overwrite: false,
        invalidate: true,
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
 * Signed URLs expire after expiresInSec seconds (default 3600 = 1 hour).
 * The browser downloads the encrypted blob via this URL, then decrypts locally.
 *
 * @param {string} publicId - Cloudinary public_id of the asset
 * @param {number} expiresInSec - TTL in seconds (default 3600)
 * @returns {string} Signed URL
 */
const generateSignedUrl = (publicId, expiresInSec = 3600) => {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
    secure: true,
  });
};

/**
 * Hard-delete a raw authenticated asset from Cloudinary.
 * invalidate:true purges all CDN edge cache copies immediately.
 *
 * @param {string} publicId - Cloudinary public_id of the asset
 * @returns {Promise<object>} Cloudinary destroy result
 */
const destroyAsset = (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true,
  });
};

module.exports = { uploadEncryptedBuffer, generateSignedUrl, destroyAsset };
