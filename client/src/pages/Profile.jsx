import { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StorageBar from '../components/profile/StorageBar';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import ChangeVaultPasswordForm from '../components/profile/ChangeVaultPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { useStorage } from '../hooks/useStorage';
import { formatDate } from '../utils/formatters';

const Profile = () => {
  const { user } = useAuth();
  const { stats, loading, fetchStats } = useStorage();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <Layout>
      <div className="profile-page flex flex-col gap-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Profile & Security
        </h1>

        {/* Account Info */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
          }}
          className="p-5 sm:p-6"
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius-lg)',
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0"
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </h2>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {user?.email}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Storage & Security Grid */}
        <div className="profile-grid">
          {/* Storage Stats */}
          <div>
            {loading ? (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-tertiary)',
                }}
                className="p-6 text-center text-xs h-full flex items-center justify-center"
              >
                Loading storage stats…
              </div>
            ) : (
              <StorageBar stats={stats} />
            )}
          </div>

          {/* Security Summary */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
            }}
            className="p-5 sm:p-6"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Security Audit Checklist
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                'AES-256-GCM authenticated file encryption',
                'PBKDF2 key derivation (310,000 iterations)',
                'AES-KW key wrapping protocol',
                'Zero-knowledge: server never receives plaintext or keys',
                'Non-extractable CryptoKey in JavaScript module closure',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-primary)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vault Password Form */}
        <ChangeVaultPasswordForm />

        {/* Account Password Form */}
        <ChangePasswordForm />
      </div>
    </Layout>
  );
};

export default Profile;
