/**
 * PBKDF2 Master Key Derivation
 *
 * Derives a 256-bit AES-KW MasterKey from the user's Master Password using:
 * - PBKDF2-HMAC-SHA256
 * - 600,000 iterations (OWASP 2023 guideline)
 * - 16-byte random salt generated on setup (stored per-user in MongoDB)
 *
 * The MasterKey is created with extractable:false — WebCrypto prevents
 * inspecting key bytes in devtools or memory dumps.
 */

export const PBKDF2_ITERATIONS = 600000;
export const SALT_BYTES        = 16;

/**
 * Generate 16 random salt bytes via CSPRNG.
 * @returns {Uint8Array} 16 random bytes
 */
export const generateSalt = () =>
  crypto.getRandomValues(new Uint8Array(SALT_BYTES));

/**
 * Derive non-extractable AES-KW MasterKey from master password + salt.
 *
 * @param {string}     masterPassword Plaintext password from vault unlock field
 * @param {Uint8Array} salt           16-byte salt from user record
 * @returns {Promise<CryptoKey>}       Non-extractable AES-KW MasterKey
 */
export const deriveMasterKey = async (masterPassword, salt) => {
  const enc = new TextEncoder();

  // Step 1: Import password string as raw KeyMaterial (PBKDF2 base)
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,      // not extractable
    ['deriveKey']
  );

  // Step 2: Run PBKDF2-SHA256 (600,000 iterations) → derive AES-KW MasterKey
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-KW', length: 256 },
    false,      // CRITICAL: non-extractable — key bytes never leak to JS scope
    ['wrapKey', 'unwrapKey']
  );

  return masterKey;
};

/**
 * Safely encode Uint8Array / ArrayBuffer → Base64 string without call stack overflow.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {string} Base64 string
 */
export const toBase64 = (bytes) => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.subarray(i, i + chunkSize);
    binStr += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binStr);
};

/**
 * Safely decode base64/base64url string → Uint8Array.
 * Handles missing padding, base64url chars (-_), whitespace, and invalid format errors gracefully.
 * @param {string} b64
 * @returns {Uint8Array}
 */
export const fromBase64 = (b64) => {
  if (!b64 || typeof b64 !== 'string') return new Uint8Array(0);
  let cleanB64 = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const mod = cleanB64.length % 4;
  if (mod === 2) cleanB64 += '==';
  else if (mod === 3) cleanB64 += '=';

  try {
    const binStr = atob(cleanB64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error('Base64 decode error:', err, 'for raw input:', b64);
    throw new Error('Invalid encryption key formatting');
  }
};
