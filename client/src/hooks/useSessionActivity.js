// Extends vault session on user activity (click, keypress, scroll)
// Prevents session from expiring while user is actively using the app

import { useEffect } from 'react';
import { useCrypto } from '../context/CryptoContext.jsx';
import { refreshVaultSession, isVaultSessionValid } from '../crypto/vaultSession.js';

export function useSessionActivity() {
  const { isVaultUnlocked } = useCrypto();

  useEffect(() => {
    if (!isVaultUnlocked) return;

    let lastActivity = Date.now();
    const THROTTLE = 60_000; // max refresh once per minute

    function onActivity() {
      const now = Date.now();
      if (now - lastActivity < THROTTLE) return;
      lastActivity = now;

      if (isVaultSessionValid()) {
        refreshVaultSession(); // extend expiry on activity
      }
    }

    // Listen for user activity
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });

    return () => {
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('scroll', onActivity);
    };
  }, [isVaultUnlocked]);
}
