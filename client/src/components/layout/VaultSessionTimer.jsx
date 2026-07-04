import { useCrypto } from '../../context/CryptoContext.jsx';
import { getSessionTimeRemaining } from '../../crypto/vaultSession.js';
import { useState, useEffect } from 'react';

export default function VaultSessionTimer() {
  const { isVaultUnlocked, lockVault } = useCrypto();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!isVaultUnlocked) return;

    const update = () => setRemaining(getSessionTimeRemaining());
    update();
    const interval = setInterval(update, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [isVaultUnlocked]);

  if (!isVaultUnlocked) return null;

  function formatRemaining(ms) {
    const totalMins = Math.floor(ms / 60000);
    if (totalMins < 60) return `${totalMins}m`;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  const isExpiringSoon = remaining < 10 * 60 * 1000; // < 10 min

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: isExpiringSoon ? 'var(--warning-subtle)' : 'var(--accent-subtle)',
        border: `1px solid ${isExpiringSoon ? 'var(--warning)' : 'var(--border-default)'}`,
        fontSize: 12,
        color: isExpiringSoon ? 'var(--warning)' : 'var(--accent)',
      }}
    >
      {/* Lock icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span style={{ fontWeight: 500 }}>{formatRemaining(remaining)}</span>
      {/* Manual lock button */}
      <button
        onClick={lockVault}
        title="Lock vault now"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 0 2px',
          color: 'currentColor',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          lineHeight: 1,
          minWidth: 'unset',
          minHeight: 'unset',
        }}
      >
        ×
      </button>
    </div>
  );
}
