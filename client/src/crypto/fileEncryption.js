/**
 * AES-256-GCM File Encryption / Decryption
 *
 * IV:      96 bits, generated with crypto.getRandomValues — NEVER deterministic.
 *          Fresh IV per file per upload. Never derived from password, filename,
 *          timestamp, counter, or any predictable value.
 * FileKey: 256-bit AES-GCM key. extractable:true only so AES-KW can wrap it.
 *          Outside wrapping it is treated as opaque and never exported raw.
 * GCM tag: 128-bit authentication tag appended by the engine automatically.
 *          decryptFile() throws DOMException if the tag doesn't verify (tamper detected).
 */

const IV_LENGTH = 12; // 96-bit GCM IV

/**
 * Generate a fresh 96-bit IV via CSPRNG.
 * Call this once per file per upload — never reuse an IV with the same key.
 * @returns {Uint8Array} 12 random bytes
 */
export const generateIV = () =>
  crypto.getRandomValues(new Uint8Array(IV_LENGTH));

/**
 * Generate a 256-bit AES-GCM FileKey.
 * extractable:true is required for AES-KW wrapKey() to work.
 * @returns {Promise<CryptoKey>}
 */
export const generateFileKey = () =>
  crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,               // must be extractable for AES-KW to wrap it
    ['encrypt', 'decrypt']
  );

/**
 * Encrypt an ArrayBuffer with AES-256-GCM.
 * Returns { ciphertext, iv } — both needed to decrypt later.
 * The GCM 128-bit auth tag is already included in ciphertext.
 *
 * @param {ArrayBuffer} fileBuffer  Plaintext image bytes (NEVER sent to server)
 * @param {CryptoKey}   fileKey     AES-256-GCM key
 * @returns {Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }>}
 */
export const encryptFile = async (fileBuffer, fileKey) => {
  const iv = generateIV(); // fresh, random, never reused
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    fileKey,
    fileBuffer
  );
  return { ciphertext, iv };
};

/**
 * Decrypt an AES-256-GCM encrypted buffer.
 * Throws DOMException('OperationError') if GCM auth tag fails (tampered data).
 *
 * @param {ArrayBuffer} encryptedBuffer  Ciphertext from Cloudinary
 * @param {CryptoKey}   fileKey          Unwrapped AES-256-GCM key
 * @param {Uint8Array}  iv               The exact IV used during encryption
 * @returns {Promise<ArrayBuffer>}        Plaintext image bytes
 */
export const decryptFile = (encryptedBuffer, fileKey, iv) =>
  crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    fileKey,
    encryptedBuffer
  );
