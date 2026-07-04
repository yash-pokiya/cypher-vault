import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  setMasterKey as saveKey,
  getMasterKey as readKey,
  clearMasterKey as eraseKey,
  hasMasterKey,
  restoreMasterKeyFromSession,
} from '../crypto/keyStorage';
import { deriveMasterKey, generateSalt, toBase64, fromBase64 } from '../crypto/keyDerivation';

const CryptoContext = createContext(null);

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const CryptoProvider = ({ children }) => {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(() => hasMasterKey());
  const autoLockTimerRef = useRef(null);

  const clearCrypto = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
    eraseKey();
    setIsVaultUnlocked(false);
  }, []);

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    if (hasMasterKey()) {
      autoLockTimerRef.current = setTimeout(() => {
        clearCrypto();
      }, SESSION_TTL_MS);
    }
  }, [clearCrypto]);

  // On mount: restore session key from sessionStorage if within 30 minutes
  useEffect(() => {
    restoreMasterKeyFromSession().then((key) => {
      if (key) {
        setIsVaultUnlocked(true);
        resetAutoLockTimer();
      } else {
        setIsVaultUnlocked(false);
      }
    });
  }, [resetAutoLockTimer]);

  const setMasterKey = useCallback(async (key) => {
    await saveKey(key);
    setIsVaultUnlocked(true);
    resetAutoLockTimer();
  }, [resetAutoLockTimer]);

  const getMasterKey = useCallback(() => {
    resetAutoLockTimer();
    return readKey();
  }, [resetAutoLockTimer]);

  // Keep session alive on user activity
  useEffect(() => {
    if (!isVaultUnlocked) return;

    const handleUserActivity = () => {
      resetAutoLockTimer();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    resetAutoLockTimer();

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [isVaultUnlocked, resetAutoLockTimer]);

  const clearMasterKey = clearCrypto;

  const isReady = useCallback(async () => {
    let key = readKey();
    if (!key) {
      key = await restoreMasterKeyFromSession();
    }
    const ready = !!key;
    setIsVaultUnlocked(ready);
    return ready;
  }, []);

  const getMasterKeyForSalt = useCallback(async (_saltB64) => {
    let key = readKey();
    if (!key) {
      key = await restoreMasterKeyFromSession();
    }
    if (key) {
      resetAutoLockTimer();
      return key;
    }
    throw new Error('Vault is locked. Please enter your vault password.');
  }, [resetAutoLockTimer]);

  const deriveFreshKey = useCallback(async (password, saltB64) => {
    const saltBytes = fromBase64(saltB64);
    return deriveMasterKey(password, saltBytes);
  }, []);

  const generateNewSalt = useCallback(() => toBase64(generateSalt()), []);

  return (
    <CryptoContext.Provider
      value={{
        isVaultUnlocked,
        setMasterKey,
        getMasterKey,
        clearMasterKey,
        clearCrypto,
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
};

export const useCryptoContext = () => {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCryptoContext must be inside CryptoProvider');
  return ctx;
};

export const useCrypto = useCryptoContext;
