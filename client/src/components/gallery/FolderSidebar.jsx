import React from 'react';

const COLOR_MAP = {
  indigo: '#4F46E5', rose: '#E11D48', amber: '#D97706',
  emerald: '#059669', sky: '#0284C7', violet: '#7C3AED',
  orange: '#EA580C', teal: '#0D9488',
};

export default function FolderSidebar({
  folders, activeFolderId, onSelectFolder, onCreateFolder, loading
}) {
  return (
    <aside className="folder-sidebar">
      <div
        className={`folder-sidebar-item ${!activeFolderId ? 'active' : ''}`}
        onClick={() => onSelectFolder(null)}
      >
        <span style={{ fontSize: 16 }}>🖼</span>
        <span className="folder-sidebar-label">All photos</span>
      </div>

      <div className="folder-sidebar-divider" />

      {loading ? (
        <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-tertiary)' }}>
          Loading…
        </div>
      ) : (
        folders.map((folder) => (
          <div
            key={folder._id}
            className={`folder-sidebar-item ${activeFolderId === folder._id ? 'active' : ''}`}
            onClick={() => onSelectFolder(folder._id)}
            style={{
              borderLeft: activeFolderId === folder._id
                ? `3px solid ${COLOR_MAP[folder.color] || 'var(--accent)'}`
                : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 16 }}>{folder.icon || '📁'}</span>
            <span className="folder-sidebar-label truncate">{folder.name}</span>
            <span
              style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}
              className="folder-sidebar-label"
            >
              {folder.fileCount}
            </span>
          </div>
        ))
      )}

      <div className="folder-sidebar-divider" />

      <button className="folder-sidebar-item folder-create-btn" onClick={onCreateFolder}>
        <span style={{ fontSize: 16 }}>+</span>
        <span className="folder-sidebar-label">New folder</span>
      </button>
    </aside>
  );
}
