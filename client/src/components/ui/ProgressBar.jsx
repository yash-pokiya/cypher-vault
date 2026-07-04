import { motion } from 'framer-motion';

const ProgressBar = ({ value = 0, color = 'default', showLabel = false, className = '' }) => {
  const pct = Math.min(100, Math.max(0, value));

  const getFillColor = () => {
    switch (color) {
      case 'success':
        return 'var(--success)';
      case 'warning':
        return 'var(--warning)';
      case 'danger':
        return 'var(--danger)';
      case 'default':
      default:
        return 'var(--progress-fill)';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{
          background: 'var(--progress-track)',
          borderRadius: 'var(--radius-full)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: getFillColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-[11px] mt-1 text-right font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {pct}%
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
