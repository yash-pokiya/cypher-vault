import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { deriveMasterKey, generateSalt, toBase64, fromBase64 } from '../crypto/keyDerivation.js';
import { unwrapFileKey } from '../crypto/keyWrapping.js';
import {
  setMasterKey as setKeyInStorage,
  getMasterKey as getKeyFromStorage,
  clearMasterKey as clearKeyInStorage,
  restoreMasterKeyFromSession,
} from '../crypto/keyStorage.js';
import {
  deriveKEK,
  wrapMasterKey,
  unwrapMasterKey,
  buildEncryptionMetadata,
} from '../crypto/envelopeEncryption.js';
import { profileAPI } from '../api/profile.api.js';
import {
  saveVaultSession,
  getVaultSession,
  clearVaultSession,
  getSessionTimeRemaining,
  getUserPreferredDuration,
} from '../crypto/vaultSession.js';
import { clearAllBlobs } from '../cache/blobCache.js';
import { clearAllMeta } from '../cache/metadataCache.js';

const CryptoContext = createContext(null);

// ── MasterKey lives ONLY in this closure — never exported raw to any storage ──
let _masterKey = null;

export function CryptoProvider({ children }) {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isRestoring, setIsRestoring]         = useState(true);
  const [sessionExpiry, setSessionExpiry]     = useState(null);

  // ── Lock vault (manual, on expiry, or on auth failure) ─────────
  const lockVault = useCallback(() => {
    _masterKey = null;
    clearKeyInStorage();
    clearVaultSession();
    clearAllBlobs();
    clearAllMeta();
    setIsVaultUnlocked(false);
    setSessionExpiry(null);
  }, []);

  // ── On app mount: check if session is still valid ────────────
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const session = getVaultSession();

        if (session) {
          // Try restoring MasterKey from sessionStorage (JWK in keyStorage)
          const masterKey = await restoreMasterKeyFromSession();
          if (masterKey && mounted) {
            _masterKey = masterKey;
            setIsVaultUnlocked(true);
            setSessionExpiry(session.expiresAt);
          }
        }
      } catch {
        // Restore failed — clear stale data
        lockVault();
      } finally {
        if (mounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [lockVault]);

  // ── Session expiry countdown ──────────────────────────────────
  useEffect(() => {
    if (!isVaultUnlocked) return;

    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      if (remaining <= 0) {
        lockVault();
      } else if (remaining < 5 * 60 * 1000) {
        setSessionExpiry(Date.now() + remaining);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isVaultUnlocked, lockVault]);

  // ── Unlock vault (called from VaultUnlockModal) ───────────────
  // CRITICAL SECURITY CONTRACT:
  //   - Under NO circumstances can `isVaultUnlocked` become `true`
  //     unless the password successfully unwraps the MasterKey.
  //   - If unwrapping fails, the vault REMAINS LOCKED, memory is purged,
  //     and an error is thrown.
  const unlockVault = useCallback(async (vaultPassword, vaultSalt, durationMs, wrappedMasterKey, vaultVerifier) => {
    const saltBytes = fromBase64(vaultSalt);

    let masterKey;

    try {
      if (wrappedMasterKey) {
        // ── ENVELOPE ENCRYPTION UNWRAP ──
        // Derive KEK from password + salt → unwrap MasterKey
        const kek = await deriveKEK(vaultPassword, saltBytes);
        masterKey = await unwrapMasterKey(kek, wrappedMasterKey);
      } else {
        // ── LEGACY MIGRATION UNWRAP ──
        // Derive MasterKey directly via PBKDF2
        masterKey = await deriveMasterKey(vaultPassword, saltBytes);

        // Verify password against vaultVerifier if present
        if (vaultVerifier) {
          await unwrapFileKey(masterKey, vaultVerifier);
        }

        // Migration: wrap and upload MasterKey for future envelope encryption unlocks
        try {
          const kek = await deriveKEK(vaultPassword, saltBytes);
          const wrapped = await wrapMasterKey(kek, masterKey);
          const metadata = buildEncryptionMetadata();
          await profileAPI.migrateVault({ wrappedMasterKey: wrapped, encryptionMetadata: metadata });
        } catch (migrationErr) {
          console.warn('[CryptoContext] Migration deferred to next unlock:', migrationErr);
        }
      }

      // SUCCESS: Password verified and MasterKey unwrapped!
      _masterKey = masterKey;
      await setKeyInStorage(masterKey);
      await saveVaultSession(vaultPassword, vaultSalt, durationMs);

      setIsVaultUnlocked(true);
      setSessionExpiry(Date.now() + (durationMs || getUserPreferredDuration()));
      return masterKey;

    } catch (err) {
      // FAILURE: Password was INCORRECT! Lock vault immediately, clear all state & caches.
      lockVault();
      throw new Error('Incorrect vault password.');
    }
  }, [lockVault]);

  // ── Manual setMasterKey for VaultSetupPage ────────────────────
  const setMasterKey = useCallback(async (key) => {
    _masterKey = key;
    await setKeyInStorage(key);
    setIsVaultUnlocked(true);
  }, []);

  // ── Key access helpers ───────────────────────────────────────
  const getMasterKey = useCallback(() => _masterKey || getKeyFromStorage(), []);
  const hasMasterKey = useCallback(() => (_masterKey || getKeyFromStorage()) !== null, []);

  const getMasterKeyForSalt = useCallback(async (_saltB64) => {
    const key = _masterKey || (await restoreMasterKeyFromSession()) || getKeyFromStorage();
    if (key) return key;
    throw new Error('Vault is locked. Please unlock first.');
  }, []);

  const deriveFreshKey = useCallback(async (password, saltB64) => {
    const saltBytes = fromBase64(saltB64);
    return deriveMasterKey(password, saltBytes);
  }, []);

  const initCrypto = useCallback(async (password) => {
    const status = await profileAPI.getVaultStatus();
    if (status?.vaultSalt) {
      await unlockVault(password, status.vaultSalt, null, status.wrappedMasterKey, status.vaultVerifier);
    }
  }, [unlockVault]);

  return (
    <CryptoContext.Provider
      value={{
        isVaultUnlocked,
        isRestoring,
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
        initCrypto,
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
