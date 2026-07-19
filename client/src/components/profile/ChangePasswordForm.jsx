import { useState } from 'react';
import toast from 'react-hot-toast';
import { profileAPI } from '../../api/profile.api';
import { fileAPI } from '../../api/file.api';
import { useCryptoContext } from '../../context/CryptoContext';
import { unwrapFileKey } from '../../crypto/keyWrapping';
import { wrapFileKey } from '../../crypto/keyWrapping';
import { toBase64, generateSalt } from '../../crypto/keyDerivation';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ChangePasswordForm = () => {
  const { getMasterKeyForSalt, deriveFreshKey, initCrypto } = useCryptoContext();
  const [form, setForm]     = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy]     = useState(false);
  const [step, setStep]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 12) {
      toast.error('New password must be at least 12 characters');
      return;
    }

    setBusy(true);
    try {
      setStep('Fetching file list…');
      let page = 1;
      let allFiles = [];
      while (true) {
        const { data } = await fileAPI.list({ page, limit: 100 });
        const payload = data?.data || {};
        const filesList = Array.isArray(payload.files) ? payload.files : Array.isArray(payload) ? payload : [];
        allFiles = [...allFiles, ...filesList];
        const pagination = payload.pagination || data?.pagination || {};
        const hasMore = typeof pagination.hasMore === 'boolean'
          ? pagination.hasMore
          : (pagination.page && pagination.pages ? pagination.page < pagination.pages : false);
        if (!hasMore) break;
        page++;
      }

      if (allFiles.length === 0) {
        await profileAPI.updatePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
        initCrypto(form.newPassword);
        toast.success('Password updated');
        setForm({ oldPassword: '', newPassword: '', confirm: '' });
        return;
      }

      setStep(`Re-wrapping ${allFiles.length} file keys…`);
      const updates = [];

      for (const file of allFiles) {
        const { data: metaRes } = await fileAPI.getMetadata(file._id);
        const meta = metaRes.data;
        const oldMasterKey = await getMasterKeyForSalt(meta.salt);
        const fileKey = await unwrapFileKey(oldMasterKey, meta.wrappedFileKey);
        const newSaltB64 = toBase64(generateSalt());
        const newMasterKey = await deriveFreshKey(form.newPassword, newSaltB64);
        const newWrappedKeyB64 = await wrapFileKey(newMasterKey, fileKey);

        updates.push({ fileId: meta.id, newWrappedFileKey: newWrappedKeyB64, newSalt: newSaltB64 });
      }

      setStep('Saving re-wrapped keys…');
      for (let i = 0; i < updates.length; i += 500) {
        const batch = updates.slice(i, i + 500);
        await fetch('/api/keys/rewrap', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ updates: batch }),
        }).then((r) => r.json());
      }

      setStep('Updating password…');
      await profileAPI.updatePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });

      initCrypto(form.newPassword);

      toast.success('Password changed and all keys re-wrapped!');
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
      setStep('');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Password change failed');
    } finally {
      setBusy(false);
      setStep('');
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="p-6"
    >
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Change Vault Password
      </h3>
      <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
        All file keys will be re-wrapped locally in your browser with the new password. Photos are never re-uploaded.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Current password"
          type="password"
          value={form.oldPassword}
          onChange={set('oldPassword')}
          disabled={busy}
          required
        />
        <Input
          label="New password"
          type="password"
          value={form.newPassword}
          onChange={set('newPassword')}
          disabled={busy}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={form.confirm}
          onChange={set('confirm')}
          disabled={busy}
          required
          error={form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : ''}
        />

        {step && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {step}
          </div>
        )}

        <Button type="submit" loading={busy} disabled={busy} size="lg" className="mt-2">
          Update password & re-wrap keys
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
