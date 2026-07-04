/**
 * AES-KW Key Wrapping / Unwrapping
 *
 * AES-KW wraps a FileKey using the MasterKey so the wrapped key bytes
 * can be safely stored in MongoDB. Without the MasterKey (derived from
 * the user's password), the wrapped key is computationally useless.
 *
 * MasterKey (AES-KW, non-extractable) ──wraps──▶ FileKey raw bytes
 * MasterKey (AES-KW, non-extractable) ──unwraps──▶ FileKey (AES-GCM, non-extractable)
 */

import { fromBase64, toBase64 } from './keyDerivation';

/**
 * Wrap a FileKey with the MasterKey using AES-KW.
 * Returns the wrapped key as a base64 string for MongoDB storage.
 *
 * @param {CryptoKey} masterKey  Non-extractable AES-KW key from PBKDF2
 * @param {CryptoKey} fileKey    Extractable AES-256-GCM key to protect
 * @returns {Promise<string>}    Base64-encoded wrapped key bytes
 */
export const wrapFileKey = async (masterKey, fileKey) => {
  const wrapped = await crypto.subtle.wrapKey('raw', fileKey, masterKey, 'AES-KW');
  return toBase64(new Uint8Array(wrapped));
};

/**
 * Unwrap a wrapped FileKey using the MasterKey.
 * The restored key is non-extractable — it can decrypt but cannot be exported.
 *
 * @param {CryptoKey} masterKey      AES-KW key from PBKDF2
 * @param {string}    wrappedKeyB64  Base64-encoded wrapped key from MongoDB
 * @returns {Promise<CryptoKey>}     Non-extractable AES-256-GCM decrypt key
 */
export const unwrapFileKey = (masterKey, wrappedKeyB64) => {
  const wrappedBytes = fromBase64(wrappedKeyB64);
  return crypto.subtle.unwrapKey(
    'raw',
    wrappedBytes,
    masterKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,            // non-extractable after unwrapping
    ['decrypt']
  );
};
