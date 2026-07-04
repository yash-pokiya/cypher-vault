import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDecrypt } from '../../hooks/useDecrypt';
import { usePrefetch } from '../../hooks/usePrefetch';
import { getCachedBlob } from '../../cache/blobCache';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import ImageViewer from './ImageViewer';
import { formatBytes, formatDate } from '../../utils/formatters';

const LockShieldIcon = () => (
  <div className="relative flex items-center justify-center">
    <div className="absolute -inset-1.5 bg-[var(--accent)]/15 rounded-full blur-sm" />
    <div
      style={{
        background: 'var(--surface-input)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform duration-200"
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
  </div>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ImageCard = ({ file, onDelete, selectMode, selected, onToggleSelect }) => {
  const { decrypt, isDecrypting, decryptError } = useDecrypt();
  const { onMouseEnter, onMouseLeave } = usePrefetch();
  const [decrypted, setDecrypted] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const cached = getCachedBlob(file._id);
    if (cached) {
      setDecrypted({
        objectUrl: cached,
        revoke: () => {},
      });
    }
  }, [file._id]);

  const handleCardClick = useCallback(async (e) => {
    if (selectMode) {
      e.stopPropagation();
      onToggleSelect?.(file._id);
      return;
    }

    if (decrypted) { setViewerOpen(true); return; }
    try {
      const result = await decrypt(file._id);
      setDecrypted(result);
      setViewerOpen(true);
    } catch { /* error state handled by hook */ }
  }, [selectMode, onToggleSelect, file._id, decrypted, decrypt]);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelect?.(file._id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--surface-card)',
          border: selected ? '2px solid var(--accent)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: selected ? '0 4px 14px rgba(94,168,255,0.2)' : 'var(--shadow-sm)',
        }}
        className="image-card group relative overflow-hidden cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] transition-all duration-200 select-none flex flex-col justify-between"
        onClick={handleCardClick}
        onMouseEnter={() => onMouseEnter(file._id)}
        onMouseLeave={() => onMouseLeave(file._id)}
      >
        {/* Aspect Ratio Image Container */}
        <div
          className="aspect-square relative overflow-hidden flex flex-col justify-between p-2"
          style={{ background: 'linear-gradient(135deg, var(--surface-card) 0%, var(--surface-input) 100%)' }}
        >
          {/* Top Bar inside Image Box: Checkbox on Left, Badge on Right */}
          <div className="flex items-center justify-between w-full z-20 pointer-events-none">
            {/* Checkbox */}
            <div
              onClick={handleCheckboxClick}
              className={[
                'pointer-events-auto w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                selected
                  ? 'bg-[var(--accent)] shadow-md scale-100'
                  : selectMode
                  ? 'bg-black/40 border-2 border-white/80 scale-100'
                  : 'bg-black/30 border-2 border-white/60 opacity-0 group-hover:opacity-100 sm:opacity-0 hover:scale-110',
              ].join(' ')}
              title={selected ? 'Deselect photo' : 'Select photo'}
            >
              {selected ? <CheckIcon /> : null}
            </div>

            {/* Encryption Badge */}
            <div className="pointer-events-none scale-90 sm:scale-100 origin-top-right">
              <Badge label={decrypted ? '🔓 DECRYPTED' : '🔐 AES-256'} variant={decrypted ? 'done' : 'encrypted'} />
            </div>
          </div>

          {/* Center Content: Decrypted Image or Locked State */}
          <AnimatePresence mode="wait">
            {decrypted ? (
              <motion.img
                key="decrypted"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                src={decrypted.objectUrl}
                alt={file.filename}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
              />
            ) : (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: selected ? 'var(--accent-subtle)' : 'transparent',
                }}
                className="my-auto flex flex-col items-center justify-center gap-1.5 text-center px-1 z-10"
              >
                {isDecrypting(file._id) ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Spinner size="sm" />
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Decrypting…
                    </p>
                  </div>
                ) : (
                  <>
                    <LockShieldIcon />
                    <p className="text-[11px] sm:text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {selectMode ? 'Tap to select' : 'Tap to decrypt'}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover / Active selection overlay */}
          {selected && (
            <div className="absolute inset-0 bg-[var(--accent)]/10 pointer-events-none z-10" />
          )}
        </div>

        {/* Info Footer Area with Delete Button on Right */}
        <div className="p-2 sm:p-2.5 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-semibold truncate flex-1" style={{ color: 'var(--text-primary)' }}>
              {file.filename}
            </p>
            {!selectMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file._id);
                }}
                style={{ color: 'var(--danger)' }}
                className="p-1 rounded-md hover:bg-red-500/15 transition-colors flex-shrink-0 cursor-pointer"
                title="Delete photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            <span className="font-mono">{formatBytes(file.size)}</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>

          {decryptError && (
            <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: 'var(--danger)' }}>
              {decryptError}
            </p>
          )}
        </div>
      </motion.div>

      <ImageViewer
        open={viewerOpen}
        onClose={handleCloseViewer}
        objectUrl={decrypted?.objectUrl}
        mimeType={decrypted?.mimeType}
        filename={file.filename}
        size={file.size}
      />
    </>
  );
};

export default ImageCard;
