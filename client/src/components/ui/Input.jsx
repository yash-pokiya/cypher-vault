import { forwardRef, useState } from 'react';

const Input = forwardRef(
  ({ label, error, type = 'text', icon: Icon, style = {}, className = '', ...props }, ref) => {
    const [showPwd, setShowPwd] = useState(false);
    const isPassword = type === 'password';
    const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative w-full">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            />
          )}
          <input
            ref={ref}
            type={inputType}
            style={{
              background: 'var(--surface-input)',
              border: error ? '1px solid var(--danger)' : '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              ...style,
            }}
            className={[
              'w-full px-3 py-2 text-sm outline-none transition-all duration-150',
              'placeholder:[color:var(--text-tertiary)]',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]',
              Icon ? 'pl-9' : '',
              isPassword ? 'pr-9' : '',
              className,
            ].join(' ')}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{ color: 'var(--text-tertiary)' }}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-[var(--text-primary)] transition-colors p-1"
              tabIndex={-1}
            >
              {showPwd ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && error.trim() && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
