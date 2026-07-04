import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      style = {},
      className = '',
      ...props
    },
    ref
  ) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'secondary':
          return {
            background: 'var(--bg-overlay)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          };
        case 'danger':
          return {
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            border: '1px solid transparent',
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid transparent',
          };
        case 'primary':
        default:
          return {
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: '1px solid transparent',
          };
      }
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        disabled={disabled || loading}
        style={{
          borderRadius: 'var(--radius-md)',
          transition: 'var(--transition)',
          fontWeight: 500,
          ...getVariantStyles(),
          ...style,
        }}
        className={[
          'inline-flex items-center justify-center gap-2 select-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizes[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
