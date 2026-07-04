import React, { useState } from 'react';

const COLOR_MAP = {
  indigo: '#4F46E5', rose: '#E11D48', amber: '#D97706',
  emerald: '#059669', sky: '#0284C7', violet: '#7C3AED',
  orange: '#EA580C', teal: '#0D9488',
};

export default function MoveToFolderModal({
  folders, currentFolderId, onMove, onClose
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || '');

  const handleConfirmMove = () => {
    onMove(selectedFolderId || null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel max-w-sm"
        style={{ maxWidth: 390 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div style={{ padding: '20px 24px 28px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            Move to folder
          </h2>

          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Select destination folder
          </p>

          {/* Folder Option List Container */}
          <div
            style={{
              background: 'var(--surface-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              maxHeight: 240,
              overflowY: 'auto',
              marginBottom: 20,
            }}
            className="divide-y divide-[var(--border-default)]"
          >
            {/* All Photos Option */}
            <div
              onClick={() => setSelectedFolderId('')}
              className={`px-3.5 py-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                selectedFolderId === ''
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                  : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">🖼</span>
                <span className="font-medium">All photos (no folder)</span>
              </div>
              {selectedFolderId === '' && (
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Folder List Items */}
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder._id;
              const accentColor = COLOR_MAP[folder.color] || '#4F46E5';

              return (
                <div
                  key={folder._id}
                  onClick={() => setSelectedFolderId(folder._id)}
                  className={`px-3.5 py-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                      : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: accentColor }}
                    />
                    <span className="text-base leading-none">{folder.icon || '📁'}</span>
                    <span className="truncate font-medium">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        background: 'var(--surface-card)',
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
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
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
              type="button"
              className="btn"
              style={{
                flex: 1,
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
              }}
              onClick={handleConfirmMove}
            >
              Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
