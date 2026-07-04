/**
 * Envelope Encryption — Client-Side Key Management
 *
 * SECURITY ARCHITECTURE:
 * ──────────────────────────────────────────────────────────────────
 * 1. MasterKey is a randomly generated AES-KW 256-bit key.
 *    It wraps/unwraps per-file AES-GCM keys.
 *
 * 2. KEK (Key Encryption Key) is derived from the user's vault password
 *    via PBKDF2-SHA256 (600,000 iterations). The KEK wraps the MasterKey
 *    using AES-KW before it's sent to the server.
 *
 * 3. The server stores ONLY the wrappedMasterKey (encrypted bytes).
 *    The plaintext MasterKey and KEK NEVER leave the browser.
 *
 * 4. On unlock, the client fetches wrappedMasterKey from the server,
 *    derives the KEK from the password, and unwraps the MasterKey in-memory.
 * ──────────────────────────────────────────────────────────────────
 */

import { toBase64, fromBase64 } from './keyDerivation.js';

const PBKDF2_ITERATIONS = 600000;

/**
 * Generate a random AES-KW 256-bit MasterKey.
 * This key wraps per-file AES-GCM keys and is itself wrapped by the KEK.
 *
 * extractable:true — required for AES-KW wrapKey() to export the raw bytes,
 * and for JWK export to sessionStorage for tab persistence.
 *
 * @returns {Promise<CryptoKey>}
 */
export async function generateMasterKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-KW', length: 256 },
    true,  // extractable — needed for wrapping and JWK export
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Derive a KEK (Key Encryption Key) from the user's vault password and salt.
 * The KEK is used to wrap/unwrap the MasterKey. It is NEVER stored anywhere.
 *
 * @param {string}     password  User's vault password (plaintext, in-memory only)
 * @param {Uint8Array} salt      16-byte PBKDF2 salt from user record
 * @returns {Promise<CryptoKey>} AES-KW key for wrapping/unwrapping MasterKey
 */
export async function deriveKEK(password, salt) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    false,  // KEK is NOT extractable — it never leaves this function's scope
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Wrap (encrypt) the MasterKey with the KEK using AES-KW.
 * Returns a base64 string safe for MongoDB storage.
 *
 * @param {CryptoKey} kek        KEK derived from vault password
 * @param {CryptoKey} masterKey  The MasterKey to protect
 * @returns {Promise<string>}    Base64-encoded wrapped key bytes
 */
export async function wrapMasterKey(kek, masterKey) {
  const wrappedBuffer = await crypto.subtle.wrapKey('raw', masterKey, kek, 'AES-KW');
  return toBase64(new Uint8Array(wrappedBuffer));
}

/**
 * Unwrap (decrypt) the MasterKey from a base64-encoded wrapped key.
 * Called on vault unlock — the KEK is derived from the user's password.
 *
 * If the password is wrong, AES-KW unwrap throws OperationError —
 * this serves as zero-knowledge password verification (no separate verifier needed).
 *
 * @param {CryptoKey} kek           KEK derived from vault password
 * @param {string}    wrappedB64    Base64-encoded wrapped key from MongoDB
 * @returns {Promise<CryptoKey>}    The unwrapped MasterKey (extractable, AES-KW)
 * @throws {DOMException}           OperationError if password is wrong
 */
export async function unwrapMasterKey(kek, wrappedB64) {
  const wrappedBytes = fromBase64(wrappedB64);

  return crypto.subtle.unwrapKey(
    'raw',
    wrappedBytes,
    kek,
    'AES-KW',
    { name: 'AES-KW', length: 256 },
    true,   // extractable — needed for JWK export to sessionStorage
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Build encryption metadata object for MongoDB storage.
 * Documents the algorithms and parameters used — useful for future migrations.
 *
 * @returns {Object} Encryption metadata
 */
export function buildEncryptionMetadata() {
  return {
    algorithm: 'AES-KW',
    kdfIterations: PBKDF2_ITERATIONS,
    kdfHash: 'SHA-256',
    masterKeyAlg: 'AES-KW',
    masterKeyLength: 256,
  };
}
