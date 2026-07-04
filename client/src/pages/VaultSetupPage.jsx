import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSalt, deriveMasterKey, toBase64 } from '../crypto';
import {
  deriveKEK,
  wrapMasterKey,
  buildEncryptionMetadata,
} from '../crypto/envelopeEncryption';
import { generateFileKey, wrapFileKey } from '../crypto';
import { useCryptoContext } from '../context/CryptoContext';
import { profileAPI } from '../api/profile.api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LOGO_URL =
  'https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png';

export default function VaultSetupPage() {
  const [vaultPassword, setVaultPassword]       = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [strength, setStrength]                 = useState(0);
  const [loading, setLoading]                   = useState(false);
  const [showPass, setShowPass]                 = useState(false);
  const { setMasterKey } = useCryptoContext();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.vaultPasswordSet) {
      navigate('/gallery', { replace: true });
    }
  }, [user, navigate]);

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
      // STEP 1: Generate cryptographic salt
      const saltBytes  = generateSalt();
      const saltBase64 = toBase64(saltBytes);

      // STEP 2: Derive MasterKey from vault password + salt
      const masterKey = await deriveMasterKey(vaultPassword, saltBytes);

      // STEP 3: Derive KEK from vault password → wrap MasterKey
      const kek = await deriveKEK(vaultPassword, saltBytes);
      const wrappedMasterKeyB64 = await wrapMasterKey(kek, masterKey);

      // STEP 4: Generate zero-knowledge verifier
      const dummyKey = await generateFileKey();
      const vaultVerifier = await wrapFileKey(masterKey, dummyKey);

      // STEP 5: Build encryption metadata for server storage
      const encryptionMetadata = buildEncryptionMetadata();

      // STEP 6: Send to server (server stores ONLY wrapped key, never plaintext)
      await profileAPI.setupVault({
        vaultSalt: saltBase64,
        wrappedMasterKey: wrappedMasterKeyB64,
        vaultVerifier,
        encryptionMetadata,
      });

      // STEP 7: Store unwrapped MasterKey in-memory for this session
      await setMasterKey(masterKey);
      updateUser({ vaultPasswordSet: true });

      toast.success('Vault secured. Your files are protected.');
      navigate('/gallery');

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Setup failed. Please try again.';
      toast.error(msg);
      console.error('[VaultSetupPage] error:', err);
    } finally {
      setLoading(false);
    }
  }

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][strength] || '';
  const strengthColor = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength] || '#666';

  const passReqs = [
    { label: 'At least 8 characters', met: vaultPassword.length >= 8 },
    { label: 'Uppercase letter',      met: /[A-Z]/.test(vaultPassword) },
    { label: 'Number',                met: /[0-9]/.test(vaultPassword) },
    { label: 'Special character',     met: /[^A-Za-z0-9]/.test(vaultPassword) },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 24,
        boxShadow: 'var(--shadow-modal)',
        padding: '32px 28px 28px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={LOGO_URL}
            alt="CYPHER Logo"
            style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto 10px' }}
            className="drop-shadow-[0_0_12px_rgba(94,168,255,0.6)]"
          />
          <h1
            style={{
              fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
            className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#818CF8]"
          >
            Secure Your CYPHER Vault
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            This password encrypts your photos. It's separate from your account password
            and never sent to our servers. <strong>If you forget it, your files cannot be recovered.</strong>
          </p>
        </div>

        {/* Warning */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
            Write this password down and keep it safe. We have no way to reset it.
          </p>
        </div>

        <form onSubmit={handleSetup}>
          {/* Vault password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Vault password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={vaultPassword}
                onChange={(e) => { setVaultPassword(e.target.value); checkStrength(e.target.value); }}
                placeholder="Enter vault password"
                style={{
                  width: '100%',
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 42px 10px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
                autoFocus
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-tertiary)',
                  cursor: 'pointer', fontSize: 14, padding: 4, minWidth: 'auto', minHeight: 'auto',
                }}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>

            {/* Strength bar */}
            {vaultPassword && (
              <div style={{ marginTop: 6 }}>
                <div style={{
                  height: 4, borderRadius: 2, background: 'var(--border-default)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(strength / 4) * 100}%`,
                    height: '100%',
                    background: strengthColor,
                    transition: 'all 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: 11, color: strengthColor, marginTop: 3, fontWeight: 600 }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Confirm vault password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter vault password"
              style={{
                width: '100%',
                background: 'var(--surface-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
              }}
              autoComplete="new-password"
            />
          </div>

          {/* Requirements */}
          <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {passReqs.map((r) => (
              <span key={r.label} style={{ fontSize: 12, color: r.met ? '#22c55e' : 'var(--text-tertiary)' }}>
                {r.met ? '✓' : '○'} {r.label}
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || vaultPassword.length < 8 || vaultPassword !== confirmPassword}
            style={{
              width: '100%',
              height: 46,
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || vaultPassword.length < 8 || vaultPassword !== confirmPassword ? 0.65 : 1,
              transition: 'opacity 0.2s ease',
              marginBottom: 14,
            }}
          >
            {loading ? 'Securing vault…' : 'Secure my vault'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          This is a one-time setup. You'll enter this password to view your photos.
        </p>
      </div>
    </div>
  );
}
