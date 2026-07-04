/**
 * Master Key Storage — In-memory closure with 30-minute sessionStorage persistence.
 *
 * SECURITY CONTRACT:
 * ──────────────────────────────────────────────────────────────────
 * • MasterKey is cached in sessionStorage under 'vault_session_master_key'
 *   with a 30-minute sliding expiration window.
 * • Page refreshes within 30 minutes restore the key automatically.
 * • Closing tab, logging out, or 30-minute inactivity clears the key.
 * ──────────────────────────────────────────────────────────────────
 */

const SESSION_KEY = 'vault_session_master_key';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

let _masterKey = null;

export const setMasterKey = async (key) => {
  _masterKey = key;
  if (typeof window !== 'undefined' && key) {
    try {
      const exportedJwk = await crypto.subtle.exportKey('jwk', key);
      const sessionData = {
        jwk: exportedJwk,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[keyStorage] Could not store key in session:', e);
    }
  }
};

export const restoreMasterKeyFromSession = async () => {
  if (_masterKey) return _masterKey;
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Refresh sliding 30-minute TTL window
    parsed.expiresAt = Date.now() + SESSION_TTL_MS;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));

    const restoredKey = await crypto.subtle.importKey(
      'jwk',
      parsed.jwk,
      { name: 'AES-KW' },
      false, // non-extractable in RAM
      ['wrapKey', 'unwrapKey']
    );

    _masterKey = restoredKey;
    return restoredKey;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const getMasterKey = () => _masterKey;

export const clearMasterKey = () => {
  _masterKey = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

export const hasMasterKey = () => {
  if (_masterKey !== null) return true;
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Date.now() < parsed.expiresAt) return true;
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
  return false;
};
