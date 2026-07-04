import React, { useEffect, useRef } from 'react';

export default function FolderContextMenu({ folder, onClose, onRename, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: 36,
        right: 6,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)',
        zIndex: 50,
        minWidth: 130,
        padding: '4px 0',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          fontSize: 13,
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
        onClick={() => {
          onClose();
          onRename();
        }}
        className="hover:bg-[var(--surface-hover)]"
      >
        ✏️ Rename
      </button>

      <button
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          fontSize: 13,
          background: 'none',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
        }}
        onClick={() => {
          onClose();
          onDelete();
        }}
        className="hover:bg-[var(--surface-hover)]"
      >
        🗑️ Delete
      </button>
    </div>
  );
}
