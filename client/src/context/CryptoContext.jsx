import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { deriveMasterKey, generateSalt, toBase64, fromBase64 } from '../crypto/keyDerivation.js';
import {
  saveVaultSession,
  getVaultSession,
  isVaultSessionValid,
  clearVaultSession,
  refreshVaultSession,
  getSessionTimeRemaining,
  getUserPreferredDuration,
} from '../crypto/vaultSession.js';
import { clearAllBlobs } from '../cache/blobCache.js';
import { clearAllMeta } from '../cache/metadataCache.js';

const CryptoContext = createContext(null);

// MasterKey lives ONLY in this closure — never exported to any storage
let _masterKey = null;

export function CryptoProvider({ children }) {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true); // true on mount
  const [sessionExpiry, setSessionExpiry] = useState(null);

  // ── On app mount: check if session is still valid ────────────
  useEffect(() => {
    async function restoreSession() {
      const session = getVaultSession();

      if (!session) {
        // No valid session → show vault unlock modal
        setIsRestoring(false);
        return;
      }

      try {
        const masterKey = await _rederiveMasterKeyFromSession(session);
        if (masterKey) {
          _masterKey = masterKey;
          setIsVaultUnlocked(true);
          setSessionExpiry(session.expiresAt);
        }
      } catch {
        // Re-derive failed — clear and ask user
        clearVaultSession();
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, []);

  // ── Session expiry countdown ──────────────────────────────────
  useEffect(() => {
    if (!isVaultUnlocked) return;

    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      if (remaining <= 0) {
        // Session expired — lock vault
        lockVault();
      } else if (remaining < 5 * 60 * 1000) {
        // Less than 5 min remaining — update UI
        setSessionExpiry(Date.now() + remaining);
      }
    }, 30_000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [isVaultUnlocked]);

  // ── Lock vault (manual or on expiry) ─────────────────────────
  const lockVault = useCallback(() => {
    _masterKey = null;
    clearVaultSession();
    _clearStoredPassword();
    clearAllBlobs();
    clearAllMeta();
    setIsVaultUnlocked(false);
    setSessionExpiry(null);
  }, []);

  // ── Unlock vault (called from VaultUnlockModal) ───────────────
  const unlockVault = useCallback(async (vaultPassword, vaultSalt, durationMs) => {
    // Derive MasterKey
    const saltBytes = Uint8Array.from(atob(vaultSalt), (c) => c.charCodeAt(0));
    const masterKey = await deriveMasterKey(vaultPassword, saltBytes);

    // Store in closure
    _masterKey = masterKey;

    // Save session token to sessionStorage
    await saveVaultSession(vaultPassword, vaultSalt, durationMs);

    // Store encrypted password for refresh re-derive
    await _storePasswordForRefresh(vaultPassword, vaultSalt);

    setIsVaultUnlocked(true);
    setSessionExpiry(Date.now() + (durationMs || getUserPreferredDuration()));
  }, []);

  // Manual setMasterKey for setup / direct unlock
  const setMasterKey = useCallback(async (key) => {
    _masterKey = key;
    setIsVaultUnlocked(true);
  }, []);

  const getMasterKey = useCallback(() => _masterKey, []);
  const hasMasterKey = useCallback(() => _masterKey !== null, []);

  const getMasterKeyForSalt = useCallback(async (_saltB64) => {
    if (_masterKey) return _masterKey;
    const session = getVaultSession();
    if (session) {
      const key = await _rederiveMasterKeyFromSession(session);
      if (key) {
        _masterKey = key;
        setIsVaultUnlocked(true);
        return key;
      }
    }
    throw new Error('Vault is locked. Please enter your vault password.');
  }, []);

  const deriveFreshKey = useCallback(async (password, saltB64) => {
    const saltBytes = fromBase64(saltB64);
    return deriveMasterKey(password, saltBytes);
  }, []);

  const generateNewSalt = useCallback(() => toBase64(generateSalt()), []);

  const isReady = useCallback(async () => {
    if (_masterKey) return true;
    const session = getVaultSession();
    if (!session) return false;
    const key = await _rederiveMasterKeyFromSession(session);
    if (key) {
      _masterKey = key;
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  }, []);

  return (
    <CryptoContext.Provider
      value={{
        isVaultUnlocked,
        isRestoring, // true while checking session on mount
        sessionExpiry,
        unlockVault,
        lockVault,
        setMasterKey,
        clearMasterKey: lockVault,
        clearCrypto: lockVault,
        getMasterKey,
        hasMasterKey,
        getMasterKeyForSalt,
        deriveFreshKey,
        generateNewSalt,
        isReady,
        isCryptoReady: isVaultUnlocked,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export const useCrypto = () => useContext(CryptoContext);
export const useCryptoContext = () => {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCryptoContext must be inside CryptoProvider');
  return ctx;
};

// ─────────────────────────────────────────────────────────────────
// INTERNAL HELPERS — password storage for refresh re-derive
// ─────────────────────────────────────────────────────────────────

let _tabEncKey = null;
const TAB_KEY_STORAGE = 'vault_tab_enc'; // sessionStorage: encrypted password
const TAB_SALT_STORAGE = 'vault_tab_salt'; // sessionStorage: salt for tab key

async function _getOrCreateTabKey() {
  if (_tabEncKey) return _tabEncKey;

  const storedSalt = sessionStorage.getItem(TAB_SALT_STORAGE);

  if (storedSalt) {
    const saltBytes = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));
    const fingerprint = _getBrowserFingerprint();
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(fingerprint),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    _tabEncKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } else {
    _tabEncKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    sessionStorage.setItem(TAB_SALT_STORAGE, btoa(String.fromCharCode(...salt)));
  }

  return _tabEncKey;
}

function _getBrowserFingerprint() {
  return [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
}

async function _storePasswordForRefresh(vaultPassword, vaultSalt) {
  try {
    const tabKey = await _getOrCreateTabKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const payload = JSON.stringify({ vaultPassword, vaultSalt });
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      tabKey,
      enc.encode(payload)
    );

    const stored = {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    };

    sessionStorage.setItem(TAB_KEY_STORAGE, JSON.stringify(stored));
  } catch {
    /* silent — worst case user re-enters vault password */
  }
}

async function _rederiveMasterKeyFromSession(session) {
  try {
    const raw = sessionStorage.getItem(TAB_KEY_STORAGE);
    if (!raw) return null;

    const { iv: ivB64, data: dataB64 } = JSON.parse(raw);
    const tabKey = await _getOrCreateTabKey();
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));

    const dec = new TextDecoder();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, tabKey, data);
    const { vaultPassword, vaultSalt } = JSON.parse(dec.decode(decrypted));

    const saltBytes = Uint8Array.from(atob(vaultSalt), (c) => c.charCodeAt(0));
    return await deriveMasterKey(vaultPassword, saltBytes);
  } catch {
    return null;
  }
}

export function _clearStoredPassword() {
  sessionStorage.removeItem(TAB_KEY_STORAGE);
  sessionStorage.removeItem(TAB_SALT_STORAGE);
  _tabEncKey = null;
}
