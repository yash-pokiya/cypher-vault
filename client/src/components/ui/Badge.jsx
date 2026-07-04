const Badge = ({ label, variant = 'default', className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'encrypted':
      case 'locked':
        return {
          background: 'var(--enc-bg)',
          color: 'var(--enc-text)',
          border: '1px solid var(--enc-border)',
        };
      case 'done':
      case 'success':
        return {
          background: 'var(--success-subtle)',
          color: 'var(--success)',
          border: '1px solid var(--success)',
        };
      case 'warning':
      case 'encrypting':
        return {
          background: 'var(--warning-subtle)',
          color: 'var(--warning)',
          border: '1px solid var(--warning)',
        };
      case 'danger':
      case 'error':
        return {
          background: 'var(--danger-subtle)',
          color: 'var(--danger)',
          border: '1px solid var(--danger)',
        };
      case 'queued':
      case 'default':
      default:
        return {
          background: 'var(--surface-input)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
        };
    }
  };

  return (
    <span
      style={{
        ...getStyles(),
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-mono)',
        padding: '2px 8px',
      }}
      className={`inline-flex items-center gap-1 font-medium select-none ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;
