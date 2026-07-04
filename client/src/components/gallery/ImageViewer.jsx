import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { formatBytes } from '../../utils/formatters';

const ImageViewer = ({ open, onClose, objectUrl, mimeType, filename, size }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsFullscreen(false);
      return;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, isFullscreen]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`modal-panel relative flex flex-col transition-all duration-300 ${
              isFullscreen
                ? 'w-screen h-screen max-w-none rounded-none border-none p-0 bg-black'
                : 'max-w-4xl max-h-[90vh]'
            }`}
            style={{
              background: isFullscreen ? '#000000' : 'var(--surface-card)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull handle for mobile (only in standard modal) */}
            {!isFullscreen && <div className="modal-handle" />}

            {/* Header Bar */}
            <div
              style={{
                background: isFullscreen ? 'rgba(0,0,0,0.85)' : 'var(--surface-nav)',
                borderBottom: isFullscreen ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-default)',
                backdropFilter: 'blur(12px)',
              }}
              className="flex items-center justify-between px-4 sm:px-6 py-3.5 z-20"
            >
              <div>
                <p
                  className="text-sm font-bold truncate max-w-xs sm:max-w-lg"
                  style={{ color: isFullscreen ? '#FFFFFF' : 'var(--text-primary)' }}
                >
                  {filename}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: isFullscreen ? '#9CA3AF' : 'var(--text-tertiary)' }}
                >
                  {formatBytes(size)} · Decrypted in browser memory
                </p>
              </div>

              {/* Action Buttons: Fullscreen Toggle & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  style={{
                    color: isFullscreen ? '#FFFFFF' : 'var(--text-tertiary)',
                    background: isFullscreen ? 'rgba(255,255,255,0.15)' : 'var(--surface-input)',
                    border: '1px solid var(--border-default)',
                  }}
                  className="p-2 rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                >
                  {isFullscreen ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 5l5 5m0 0l-5 0m5 0l0-5M9 15l-5 5m0 0l5 0m-5 0l0-5m11-5l5-5m0 0l-5 0m5 0l0 5" />
                      </svg>
                      <span className="hidden sm:inline">Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="hidden sm:inline">Fullscreen</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    color: isFullscreen ? '#FFFFFF' : 'var(--text-tertiary)',
                    background: isFullscreen ? 'rgba(255,255,255,0.15)' : 'var(--surface-input)',
                    border: '1px solid var(--border-default)',
                  }}
                  className="p-2 rounded-lg hover:opacity-90 transition-all cursor-pointer"
                  title="Close viewer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content Area (Image Viewer) */}
            <div
              className={`flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 transition-colors duration-300 ${
                isFullscreen ? 'bg-black h-full' : 'min-h-[300px] sm:min-h-[480px] bg-[var(--bg-secondary)]'
              }`}
            >
              {objectUrl && (
                <img
                  src={objectUrl}
                  alt={filename}
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title="Click to toggle fullscreen mode"
                  className={`object-contain transition-all duration-300 cursor-zoom-in ${
                    isFullscreen
                      ? 'w-full h-full max-w-full max-h-full rounded-none'
                      : 'max-w-full max-h-[70vh] rounded-xl shadow-lg hover:scale-[1.01]'
                  }`}
                />
              )}
            </div>

            {/* Footer Notice */}
            {!isFullscreen && (
              <div
                className="px-5 py-2.5 text-center text-xs border-t font-mono"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-tertiary)',
                }}
              >
                🔐 AES-256-GCM Decrypted · Object URL Revoked On Close
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageViewer;
