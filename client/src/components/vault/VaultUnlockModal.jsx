import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCrypto } from '../../context/CryptoContext.jsx';
import { profileAPI } from '../../api/profile.api.js';
import { VAULT_SESSION } from '../../config/vaultSession.config.js';
import {
  setUserPreferredDuration,
  getUserPreferredDuration,
} from '../../crypto/vaultSession.js';

export default function VaultUnlockModal({ onUnlocked }) {
  const { unlockVault } = useCrypto();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [duration, setDuration] = useState(getUserPreferredDuration());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const DURATION_OPTIONS = [
    { label: '30 minutes', value: VAULT_SESSION.DURATIONS.SHORT },
    { label: '2 hours', value: VAULT_SESSION.DURATIONS.MEDIUM },
    { label: '8 hours', value: VAULT_SESSION.DURATIONS.LONG },
    { label: '24 hours', value: VAULT_SESSION.DURATIONS.DAY },
  ];

  async function handleUnlock(e) {
    e.preventDefault();
    if (!password.trim() || attempts >= 5) return;

    setLoading(true);
    setError('');

    try {
      const res = await profileAPI.getVaultStatus();
      const vaultSalt = res?.vaultSalt || res?.data?.vaultSalt;
      if (!vaultSalt) {
        throw new Error('Vault salt not configured');
      }

      setUserPreferredDuration(duration);

      // Unlock vault — derives MasterKey + saves session token
      await unlockVault(password, vaultSalt, duration);

      toast.success('Vault unlocked');
      if (onUnlocked) onUnlocked();
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setError('Too many failed attempts. Wait 30 seconds.');
        setTimeout(() => setAttempts(0), 30_000);
      } else {
        setError(err.message || 'Incorrect vault password.');
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
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          <img
            src="https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png"
            alt="CYPHER Logo"
            style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto 10px' }}
            className="drop-shadow-[0_0_12px_rgba(94,168,255,0.6)]"
          />
          <h2
            style={{
              fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
            className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#818CF8]"
          >
            Unlock CYPHER Vault
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Enter your vault password to decrypt photos
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

          {/* Duration selector */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Keep vault unlocked for
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border:
                      duration === opt.value
                        ? '1.5px solid var(--accent)'
                        : '1px solid var(--border-default)',
                    background:
                      duration === opt.value
                        ? 'var(--accent-subtle)'
                        : 'var(--surface-input)',
                    color:
                      duration === opt.value
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
