import React, { useState } from 'react';
import toast from 'react-hot-toast';

const COLOR_MAP = {
  indigo: '#4F46E5', rose: '#E11D48', amber: '#D97706',
  emerald: '#059669', sky: '#0284C7', violet: '#7C3AED',
  orange: '#EA580C', teal: '#0D9488',
};

const COLORS = ['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet', 'orange', 'teal'];
const ICONS  = ['📁', '🏖', '👨‍👩‍👧', '💼', '🎨', '🏋️', '🌍', '❤️', '📸', '🎵', '🌿', '🏠'];

export default function CreateFolderModal({ onClose, onCreate, initialFolder = null }) {
  const [name, setName]       = useState(initialFolder?.name || '');
  const [color, setColor]     = useState(initialFolder?.color || 'indigo');
  const [icon, setIcon]       = useState(initialFolder?.icon || '📁');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setLoadingMsg(initialFolder ? 'Updating folder…' : 'Creating secure folder…');

    try {
      await onCreate({ name: name.trim(), color, icon });
      toast.success(initialFolder ? '✔ Folder updated' : '✔ Folder created');
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('A folder with that name already exists');
      } else {
        toast.error('Could not save folder. Cloud storage temporarily unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel max-w-sm"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div style={{ padding: '20px 24px 28px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            {initialFolder ? 'Edit folder' : 'New folder'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                Folder name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vacations 2026"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  outline: 'none',
                }}
                maxLength={50}
                required
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
              Icon
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  disabled={loading}
                  onClick={() => setIcon(ic)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    border: icon === ic ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                    background: icon === ic ? 'var(--accent-subtle)' : 'var(--surface-input)',
                    fontSize: 18,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    minWidth: 'auto',
                    minHeight: 'auto',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={loading}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: COLOR_MAP[c],
                    border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    minWidth: 'auto',
                    minHeight: 'auto',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={loading}
                className="btn"
                style={{
                  flex: 1,
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="btn"
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {loadingMsg}
                  </>
                ) : initialFolder ? (
                  'Save changes'
                ) : (
                  'Create folder'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}