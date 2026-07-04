import { motion } from 'framer-motion';
import { formatBytes } from '../../utils/formatters';

const StorageBar = ({ stats }) => {
  if (!stats) return null;

  // Real dynamic storage calculated from user uploaded files
  const plainBytes = stats.totalPlaintextBytes || 0;
  const encBytes   = stats.totalEncryptedBytes || 0;
  const fileCount  = stats.fileCount || 0;

  // Limit defaults to 10 GB (or custom limit if available)
  const limitBytes = stats.cloudinary?.storageLimitBytes || 10 * 1024 * 1024 * 1024;
  const pct        = limitBytes > 0 ? Math.min(100, (encBytes / limitBytes) * 100) : 0;

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
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Storage Usage
      </h3>

      <div className="flex justify-between text-sm mb-2">
        <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          {formatBytes(encBytes)}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          of {formatBytes(limitBytes)}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-2.5 rounded-full overflow-hidden mb-6"
        style={{ background: 'var(--progress-track)', borderRadius: 'var(--radius-full)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, pct)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Real Dynamic Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
          className="p-4"
        >
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {fileCount}
          </p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            Encrypted files
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
          className="p-4"
        >
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {formatBytes(plainBytes)}
          </p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            Original total size
          </p>
        </div>
      </div>
    </div>
  );
};

export default StorageBar;
