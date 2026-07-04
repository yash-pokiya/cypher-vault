import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSalt, deriveMasterKey, toBase64 } from '../crypto';
import { useCryptoContext } from '../context/CryptoContext';
import { profileAPI } from '../api/profile.api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function VaultSetupPage() {
  const [vaultPassword, setVaultPassword]       = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [strength, setStrength]                 = useState(0);
  const [loading, setLoading]                   = useState(false);
  const [showPass, setShowPass]                 = useState(false);
  const { setMasterKey } = useCryptoContext();
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  function checkStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setStrength(score);
  }

  async function handleSetup(e) {
    e.preventDefault();

    if (vaultPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (vaultPassword.length < 8) {
      toast.error('Vault password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const saltBytes  = generateSalt();
      const saltBase64 = toBase64(saltBytes);

      const masterKey = await deriveMasterKey(vaultPassword, saltBytes);

      setMasterKey(masterKey);

      await profileAPI.setupVault({ vaultSalt: saltBase64 });

      updateUser({ vaultPasswordSet: true });

      toast.success('Vault secured. Your files are protected.');
      navigate('/gallery');

    } catch (err) {
      toast.error(err.response?.data?.error || 'Setup failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const strengthColors = ['', 'var(--danger)', '#F97316', 'var(--warning)', '#22C55E', 'var(--success)'];

  return (
    <div className="auth-page transition-colors duration-250">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            Secure your vault
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This password encrypts your photos. It's separate from your account password and never sent to our servers.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>If you forget it, your files cannot be recovered.</strong>
          </p>
        </div>

        {/* Warning banner */}
        <div style={{
          background: 'var(--warning-subtle)',
          border: '1px solid var(--warning)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 24,
          fontSize: 13, color: 'var(--warning)', display: 'flex', gap: 8,
        }}>
          <span>⚠️</span>
          <span>Write this password down and keep it safe. We have no way to reset it.</span>
        </div>

        <form onSubmit={handleSetup}>
          {/* Vault password input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Vault password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={vaultPassword}
                onChange={e => {
                  setVaultPassword(e.target.value);
                  checkStrength(e.target.value);
                }}
                placeholder="Choose a strong vault password"
                style={{
                  width: '100%',
                  paddingRight: 44,
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  outline: 'none',
                }}
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                  padding: 4, minWidth: 'auto', minHeight: 'auto',
                }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>

            {/* Strength bar — only show if user typed something */}
            {vaultPassword.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: 'var(--border-default)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength / 5) * 100}%`,
                    background: strengthColors[strength],
                    borderRadius: 2,
                    transition: 'width 300ms ease, background 300ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 500, marginTop: 4, display: 'block' }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Confirm vault password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat vault password"
              style={{
                width: '100%',
                background: 'var(--surface-input)',
                border: `1px solid ${confirmPassword.length > 0 && confirmPassword !== vaultPassword ? 'var(--danger)' : 'var(--border-default)'}`,
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                outline: 'none',
              }}
              required
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && confirmPassword !== vaultPassword && (
              <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>
                Passwords don't match
              </span>
            )}
          </div>

          {/* Requirements checklist */}
          <div style={{ marginBottom: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            {[
              { label: 'At least 8 characters', met: vaultPassword.length >= 8 },
              { label: 'Uppercase letter',       met: /[A-Z]/.test(vaultPassword) },
              { label: 'Number',                 met: /[0-9]/.test(vaultPassword) },
              { label: 'Special character',      met: /[^A-Za-z0-9]/.test(vaultPassword) },
            ].map(({ label, met }) => (
              <div key={label} style={{
                display: 'flex', gap: 6,
                alignItems: 'center', marginBottom: 4,
                color: met ? 'var(--success)' : 'var(--text-tertiary)',
              }}>
                <span>{met ? '✓' : '○'}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || vaultPassword !== confirmPassword || vaultPassword.length < 8}
            className="btn btn-full-mobile"
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Securing vault…' : 'Secure my vault'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>
          This is a one-time setup. You'll enter this password to view your photos.
        </p>
      </div>
    </div>
  );
}
