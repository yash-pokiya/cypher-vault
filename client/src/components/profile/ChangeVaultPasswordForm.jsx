import { useState } from 'react';
import { useCryptoContext } from '../../context/CryptoContext';
import { profileAPI } from '../../api/profile.api';
import { fileAPI } from '../../api/file.api';
import { deriveMasterKey, generateSalt, toBase64, fromBase64, unwrapFileKey, wrapFileKey } from '../../crypto';
import toast from 'react-hot-toast';

export default function ChangeVaultPasswordForm() {
  const { setMasterKey } = useCryptoContext();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleChange(e) {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8)  { toast.error('New vault password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const { vaultSalt: oldSaltB64 } = await profileAPI.getVaultStatus();
      if (!oldSaltB64) throw new Error('Vault salt not set');
      const oldSaltBytes = fromBase64(oldSaltB64);

      const oldMasterKey = await deriveMasterKey(oldPassword, oldSaltBytes);

      const { data: listRes } = await fileAPI.list({ limit: 500 });
      const files = listRes.data || [];

      const newSaltBytes  = generateSalt();
      const newSaltBase64 = toBase64(newSaltBytes);

      const newMasterKey = await deriveMasterKey(newPassword, newSaltBytes);

      const rewrappedKeys = [];
      for (const file of files) {
        try {
          const { data: metaRes } = await fileAPI.getMetadata(file._id);
          const meta = metaRes.data;
          const fileKey = await unwrapFileKey(oldMasterKey, meta.wrappedFileKey);
          const newWrappedKeyB64 = await wrapFileKey(newMasterKey, fileKey);
          rewrappedKeys.push({
            fileId: file._id,
            wrappedFileKey: newWrappedKeyB64,
            iv: meta.iv,
            salt: newSaltBase64,
          });
        } catch (err) {
          console.error(`Failed to rewrap file ${file._id}:`, err);
        }
      }

      await profileAPI.changeVaultPassword({ newVaultSalt: newSaltBase64, rewrappedKeys });

      setMasterKey(newMasterKey);

      toast.success('Vault password changed. All files re-secured.');
      setOldPassword('');
      setNewPassword('');
      setConfirm('');

    } catch (err) {
      if (err.message?.includes('unwrap') || err.name === 'OperationError') {
        toast.error('Current vault password is incorrect');
      } else {
        toast.error(err.response?.data?.error || 'Change failed. Please try again.');
      }
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
          Your vault password encrypts your files locally. Changing it will re-encrypt all file keys with your new password.
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
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Re-securing files…' : 'Update Vault Password'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>
          All your file keys will be re-wrapped locally. Cloudinary assets remain untouched.
        </p>
      </form>
    </div>
  );
}
