import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { deriveMasterKey, fromBase64 } from '../../crypto';
import { useCryptoContext } from '../../context/CryptoContext';
import { profileAPI } from '../../api/profile.api';

export default function VaultUnlockModal({ onUnlocked }) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [attempts, setAttempts] = useState(0);
  const { setMasterKey }        = useCryptoContext();

  async function handleUnlock(e) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { vaultSalt } = await profileAPI.getVaultStatus();
      if (!vaultSalt) {
        throw new Error('Vault salt not configured');
      }

      const saltBytes = fromBase64(vaultSalt);
      const masterKey = await deriveMasterKey(password, saltBytes);

      setMasterKey(masterKey);

      toast.success('Vault unlocked');
      if (onUnlocked) onUnlocked(masterKey);

    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setError('Too many failed attempts. Wait 30 seconds.');
        setTimeout(() => setAttempts(0), 30000);
      } else {
        setError('Incorrect vault password. Try again.');
      }
    } finally {
      setLoading(false);
      setPassword('');
    }
  }

  const locked = attempts >= 5;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-modal)',
          padding: '28px 24px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header Icon + Info */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Vault is locked
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Enter your vault password to decrypt your photos.
          </p>
        </div>

        <form onSubmit={handleUnlock}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Vault password"
                style={{
                  width: '100%',
                  background: 'var(--surface-input)',
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`,
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 42px 10px 14px',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                disabled={loading || locked}
                autoFocus
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 4,
                  minWidth: 'auto',
                  minHeight: 'auto',
                }}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, textAlign: 'center' }}>
                {error}
              </p>
            )}
          </div>

          {/* Attempts countdown */}
          {attempts > 0 && attempts < 5 && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, textAlign: 'center' }}>
              {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
            </p>
          )}

          <button
            type="submit"
            disabled={loading || locked || !password.trim()}
            style={{
              width: '100%',
              height: 44,
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || locked || !password.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || locked || !password.trim() ? 0.65 : 1,
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              marginBottom: 16,
            }}
          >
            {loading ? 'Unlocking…' : locked ? 'Locked (wait 30s)' : 'Unlock vault'}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
            Zero-knowledge encryption • Files cannot be recovered without vault password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
