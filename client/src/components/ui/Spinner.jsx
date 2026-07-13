import { forwardRef } from 'react';

/**
 * Highly compatible, layout-stable loading spinner.
 * Uses inline styles to guarantee exact dimensions on all devices and browsers,
 * preventing layout shifting or size blowing up.
 */
const Spinner = forwardRef(({ size = 'md', className = '', style = {}, ...props }, ref) => {
  // Explicit pixel sizes to avoid dependency on Tailwind compile or custom resets
  const sizes = {
    xs: 14,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  };

  const pixelSize = sizes[size] || sizes['md'];

  return (
    <svg
      ref={ref}
      className={`animate-spin ${className}`}
      style={{
        color: 'var(--accent)',
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
});

Spinner.displayName = 'Spinner';

export default Spinner;
