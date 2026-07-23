import { useState } from 'react';
import toast from 'react-hot-toast';
import { profileAPI } from '../../api/profile.api';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ChangePasswordForm = () => {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);

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
    if (!/[A-Z]/.test(form.newPassword)) {
      toast.error('New password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(form.newPassword)) {
      toast.error('New password must contain at least one number');
      return;
    }

    setBusy(true);
    try {
      await profileAPI.updatePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success('Account password updated successfully!');
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Account password change failed');
    } finally {
      setBusy(false);
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
      className="p-5 sm:p-6"
    >
      <form onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Change Account Password
        </h3>
        <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
          Update the password used to log in to your account. This is separate from your Vault encryption password.
        </p>

        <div className="flex flex-col gap-4">
          <Input
            label="Current Account Password"
            type="password"
            placeholder="Current account password"
            value={form.oldPassword}
            onChange={set('oldPassword')}
            disabled={busy}
            required
          />
          <Input
            label="New Account Password"
            type="password"
            placeholder="New account password (min 12 chars, uppercase & number)"
            value={form.newPassword}
            onChange={set('newPassword')}
            disabled={busy}
            required
          />
          <Input
            label="Confirm New Account Password"
            type="password"
            placeholder="Confirm new account password"
            value={form.confirm}
            onChange={set('confirm')}
            disabled={busy}
            required
            error={form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : ''}
          />

          <Button type="submit" loading={busy} disabled={busy} size="lg" className="mt-2">
            Update Account Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;

