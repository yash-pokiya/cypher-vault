import React from 'react';

const COLOR_MAP = {
  indigo: '#4F46E5', rose: '#E11D48', amber: '#D97706',
  emerald: '#059669', sky: '#0284C7', violet: '#7C3AED',
  orange: '#EA580C', teal: '#0D9488',
};

export default function FolderGrid({
  folders,
  activeFolderId,
  onOpenFolder,
  onCreateFolder,
}) {
  return (
    <div className="folder-chips-container">
      {/* All Photos Chip */}
      <button
        type="button"
        className={`folder-chip ${activeFolderId === null ? 'active' : ''}`}
        onClick={() => onOpenFolder(null)}
      >
        <span className="folder-chip-icon">🖼</span>
        <span className="folder-chip-title">All photos</span>
      </button>

      {/* User Folder Chips */}
      {folders.map((folder) => {
        const isActive = activeFolderId === folder._id;
        const accentColor = COLOR_MAP[folder.color] || '#4F46E5';

        return (
          <button
            key={folder._id}
            type="button"
            className={`folder-chip ${isActive ? 'active' : ''}`}
            onClick={() => onOpenFolder(folder._id)}
            style={{
              borderColor: isActive ? accentColor : undefined,
            }}
          >
            <span
              className="folder-chip-color-dot"
              style={{ background: accentColor }}
            />
            <span className="folder-chip-icon">{folder.icon || '📁'}</span>
            <span className="folder-chip-title">{folder.name}</span>
            <span className="folder-chip-count">{folder.fileCount}</span>
          </button>
        );
      })}

      {/* Add Folder Chip */}
      <button
        type="button"
        className="folder-chip folder-chip-add"
        onClick={onCreateFolder}
      >
        <span className="folder-chip-icon" style={{ color: 'var(--accent)', fontWeight: 700 }}>+</span>
        <span className="folder-chip-title" style={{ color: 'var(--accent)' }}>New</span>
      </button>
    </div>
  );
}
