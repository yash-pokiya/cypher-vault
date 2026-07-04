import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCrypto } from '../../context/CryptoContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { profileAPI } from '../../api/profile.api.js';
import { withSlowNotice } from '../../utils/slowNetworkNotice.js';
import { VAULT_SESSION } from '../../config/vaultSession.config.js';
import {
  setUserPreferredDuration,
  getUserPreferredDuration,
} from '../../crypto/vaultSession.js';

export default function VaultUnlockModal({ onUnlocked }) {
  const { unlockVault, lockVault } = useCrypto();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [duration, setDuration] = useState(getUserPreferredDuration());
  const [loading, setLoading] = useState(false);
  const [unlockStage, setUnlockStage] = useState('Unlocking vault…');
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const isSubmittingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // On mount: fetch lockout status from server (survives page refresh & restart)
  useEffect(() => {
    let mounted = true;
    async function checkLockStatus() {
      try {
        const res = await profileAPI.getVaultStatus();
        const status = res?.data || res;
        if (status?.locked && status?.remainingSeconds > 0 && mounted) {
          setRemainingSeconds(status.remainingSeconds);
          setError(`Too many failed attempts. Wait ${status.remainingSeconds} seconds.`);
        }
      } catch {
        /* best effort */
      }
    }
    checkLockStatus();
    return () => { mounted = false; };
  }, []);

  // Countdown timer effect (ticks every 1s)
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('');
          profileAPI.getVaultStatus().then((res) => {
            const status = res?.data || res;
            if (status?.locked && status?.remainingSeconds > 0) {
              setRemainingSeconds(status.remainingSeconds);
              setError(`Too many failed attempts. Wait ${status.remainingSeconds} seconds.`);
            }
          });
          return 0;
        }
        const next = prev - 1;
        setError(`Too many failed attempts. Wait ${next} seconds.`);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const DURATION_OPTIONS = [
    { label: '30 minutes', value: VAULT_SESSION.DURATIONS.SHORT },
    { label: '2 hours', value: VAULT_SESSION.DURATIONS.MEDIUM },
    { label: '8 hours', value: VAULT_SESSION.DURATIONS.LONG },
    { label: '24 hours', value: VAULT_SESSION.DURATIONS.DAY },
  ];

  async function handleUnlock(e) {
    e.preventDefault();
    if (!password.trim() || remainingSeconds > 0 || isSubmittingRef.current || loading) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setUnlockStage('Verifying password…');
    setError('');

    toast.dismiss();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const unlockProcess = (async () => {
        setUnlockStage('Retrieving key derivation parameters…');
        const res = await profileAPI.getVaultStatus();
        const vaultStatus = res?.data || res;

        if (vaultStatus?.locked && vaultStatus?.remainingSeconds > 0) {
          setRemainingSeconds(vaultStatus.remainingSeconds);
          setError(`Too many failed attempts. Wait ${vaultStatus.remainingSeconds} seconds.`);
          return false;
        }

        const vaultSalt = vaultStatus?.vaultSalt;
        const wrappedMasterKey = vaultStatus?.wrappedMasterKey;
        const vaultVerifier = vaultStatus?.vaultVerifier;

        if (!vaultSalt) {
          throw new Error('Vault salt not configured');
        }

        setUserPreferredDuration(duration);

        setUnlockStage('Decrypting master key with AES-256…');
        await unlockVault(password, vaultSalt, duration, wrappedMasterKey, vaultVerifier);

        setUnlockStage('Restoring secure session…');
        await profileAPI.reportSuccessfulUnlock();
        return true;
      })();

      const success = await withSlowNotice(
        unlockProcess,
        'Deriving vault keys with PBKDF2… Secure key derivation takes longer for high iteration counts.'
      );

      if (success !== false) {
        toast.dismiss();
        toast.success('✔ Vault unlocked');
        setPassword('');
        setRemainingSeconds(0);
        setError('');

        if (onUnlocked) onUnlocked();
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      const report = await profileAPI.reportFailedUnlock();

      if (report?.locked || report?.remainingSeconds > 0) {
        setRemainingSeconds(report.remainingSeconds);
        setError(`Too many failed attempts. Wait ${report.remainingSeconds} seconds.`);
      } else {
        setError(err.message || 'Incorrect vault password.');
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  const isLocked = remainingSeconds > 0;

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
                  if (error && !isLocked) setError('');
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
                disabled={loading || isLocked}
                autoFocus
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                disabled={loading || isLocked}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: loading || isLocked ? 'not-allowed' : 'pointer',
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
                  disabled={loading || isLocked}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: loading || isLocked ? 'not-allowed' : 'pointer',
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

          <button
            type="submit"
            disabled={loading || isLocked || !password.trim()}
            style={{
              width: '100%',
              height: 44,
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || isLocked || !password.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || isLocked || !password.trim() ? 0.65 : 1,
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {unlockStage}
              </>
            ) : isLocked ? (
              `Locked (wait ${remainingSeconds}s)`
            ) : (
              'Unlock vault'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: 8 }}>
            Zero-knowledge encryption • Files cannot be recovered without vault password.
          </p>
          <button
            type="button"
            onClick={() => {
              lockVault();
              logout();
            }}
            disabled={loading}
            style={{
              color: 'var(--danger)',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign out & switch account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
