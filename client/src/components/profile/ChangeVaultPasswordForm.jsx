import { useState } from 'react';
import { useCryptoContext } from '../../context/CryptoContext';
import { profileAPI } from '../../api/profile.api';
import {
  deriveMasterKey,
  generateSalt,
  toBase64,
  fromBase64,
  generateFileKey,
  wrapFileKey,
  unwrapFileKey,
} from '../../crypto';
import {
  deriveKEK,
  wrapMasterKey,
  unwrapMasterKey,
  buildEncryptionMetadata,
} from '../../crypto/envelopeEncryption';
import toast from 'react-hot-toast';

export default function ChangeVaultPasswordForm() {
  const { setMasterKey } = useCryptoContext();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleChange(e) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New vault password must be at least 8 characters');
      return;
    }

    setLoading(true);
    toast.dismiss();

    try {
      // STEP 1: Fetch vault status from server
      const status = await profileAPI.getVaultStatus();
      if (!status?.vaultSalt) {
        throw new Error('Vault salt not set');
      }

      const oldSaltBytes = fromBase64(status.vaultSalt);
      let masterKey;

      // STEP 2: Verify current vault password by unwrapping wrappedMasterKey
      try {
        if (status.wrappedMasterKey) {
          const oldKek = await deriveKEK(oldPassword, oldSaltBytes);
          masterKey = await unwrapMasterKey(oldKek, status.wrappedMasterKey);
        } else {
          masterKey = await deriveMasterKey(oldPassword, oldSaltBytes);
          if (status.vaultVerifier) {
            await unwrapFileKey(masterKey, status.vaultVerifier);
          }
        }
      } catch (verifyErr) {
        toast.error('Current vault password is incorrect');
        setLoading(false);
        return;
      }

      // STEP 3: Generate new random salt & derive KEK for new password
      const newSaltBytes  = generateSalt();
      const newSaltBase64 = toBase64(newSaltBytes);
      const newKek = await deriveKEK(newPassword, newSaltBytes);

      // STEP 4: Re-wrap the SAME masterKey with the new KEK (Envelope Encryption)
      // Note: MasterKey stays identical so existing uploaded files decrypt seamlessly!
      const newWrappedMasterKeyB64 = await wrapMasterKey(newKek, masterKey);

      // STEP 5: Generate new zero-knowledge verifier
      const dummyKey = await generateFileKey();
      const newVaultVerifier = await wrapFileKey(masterKey, dummyKey);

      const encryptionMetadata = buildEncryptionMetadata();

      // STEP 6: Save updated wrapped master key & salt to MongoDB
      await profileAPI.changeVaultPassword({
        newVaultSalt: newSaltBase64,
        wrappedMasterKey: newWrappedMasterKeyB64,
        vaultVerifier: newVaultVerifier,
        rewrappedKeys: [],
        encryptionMetadata,
      });

      // STEP 7: Keep vault unlocked with masterKey in memory
      await setMasterKey(masterKey);

      toast.success('Vault password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirm('');

    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Change failed. Please try again.');
      console.error('[ChangeVaultPasswordForm] Error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="p-5 sm:p-6"
    >
      <form onSubmit={handleChange} style={{ maxWidth: 460 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Change Vault Password
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Your vault password protects your Master Key. Changing it re-encrypts your Master Key with the new password. Your files remain protected with 0 re-uploading needed.
        </p>

        {/* Current vault password */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Current Vault Password
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Current vault password"
            style={{
              width: '100%',
              background: 'var(--surface-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
            disabled={loading}
            required
          />
        </div>

        {/* New vault password */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            New Vault Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New vault password (min 8 chars)"
            style={{
              width: '100%',
              background: 'var(--surface-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
            disabled={loading}
            required
          />
        </div>

        {/* Confirm new vault password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Confirm New Vault Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new vault password"
            style={{
              width: '100%',
              background: 'var(--surface-input)',
              border: `1px solid ${confirm.length > 0 && confirm !== newPassword ? 'var(--danger)' : 'var(--border-default)'}`,
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
            disabled={loading}
            required
          />
          {confirm.length > 0 && confirm !== newPassword && (
            <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>
              Passwords do not match
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !oldPassword || !newPassword || newPassword !== confirm}
          className="btn btn-full-mobile"
          style={{
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            fontSize: 13,
            height: 40,
            opacity: loading || !oldPassword || !newPassword || newPassword !== confirm ? 0.65 : 1,
            cursor: loading || !oldPassword || !newPassword || newPassword !== confirm ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Updating vault password…' : 'Update Vault Password'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>
          Zero-knowledge envelope encryption • Files do not need to be re-uploaded.
        </p>
      </form>
    </div>
  );
}
