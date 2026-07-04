import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_MAP = {
  indigo: '#4F46E5', rose: '#E11D48', amber: '#D97706',
  emerald: '#059669', sky: '#0284C7', violet: '#7C3AED',
  orange: '#EA580C', teal: '#0D9488',
};

export default function FolderSelector({ folders = [], value = '', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedFolder = folders.find((f) => f._id === value) || null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (folderId) => {
    onChange(folderId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: 'var(--surface-input)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
        }}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-medium hover:border-[var(--border-strong)] transition-all cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base leading-none">
            {selectedFolder ? selectedFolder.icon || '📁' : '🖼'}
          </span>
          <span className="truncate font-semibold">
            {selectedFolder ? selectedFolder.name : 'All photos (no specific folder)'}
          </span>
          {selectedFolder && (
            <span
              style={{
                background: 'var(--surface-card)',
                color: 'var(--text-tertiary)',
                borderRadius: '10px',
              }}
              className="px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
            >
              {selectedFolder.fileCount || 0} photo{selectedFolder.fileCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-modal)',
              borderRadius: 'var(--radius-lg)',
            }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden py-1.5 max-h-60 overflow-y-auto"
          >
            {/* All Photos Option */}
            <div
              onClick={() => handleSelect('')}
              className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                value === '' ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">🖼</span>
                <span>All photos (no specific folder)</span>
              </div>
              {value === '' && (
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {folders.length > 0 && <div style={{ height: 1, background: 'var(--border-default)', margin: '4px 0' }} />}

            {/* Folder List Items */}
            {folders.map((folder) => {
              const isSelected = value === folder._id;
              const accentColor = COLOR_MAP[folder.color] || '#4F46E5';

              return (
                <div
                  key={folder._id}
                  onClick={() => handleSelect(folder._id)}
                  className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: accentColor }}
                    />
                    <span className="text-base leading-none">{folder.icon || '📁'}</span>
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        background: 'var(--surface-input)',
                        color: 'var(--text-tertiary)',
                        borderRadius: '10px',
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold"
                    >
                      {folder.fileCount || 0} photo{folder.fileCount !== 1 ? 's' : ''}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
