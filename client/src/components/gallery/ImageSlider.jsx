import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBytes, formatDate } from '../../utils/formatters';
import Spinner from '../ui/Spinner';

// SVG Icons as inline components
const BackArrow = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronLeft = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SWIPE_THRESHOLD = 50;

const ImageSlider = ({ open, onClose, files, thumbnails, initialIndex = 0, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Reset index when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setShowControls(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialIndex]);

  const currentFile = files[currentIndex];
  const currentUrl = currentFile ? thumbnails[currentFile._id] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, files.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goNext, goPrev, onClose]);

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
    setIsSwiping(false);
  };

  const onTouchMove = (e) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
    if (Math.abs(delta) > 10) setIsSwiping(true);
  };

  const onTouchEnd = () => {
    if (touchDelta > SWIPE_THRESHOLD && hasPrev) goPrev();
    else if (touchDelta < -SWIPE_THRESHOLD && hasNext) goNext();
    setTouchStart(null);
    setTouchDelta(0);
    setIsSwiping(false);
  };

  // Toggle controls visibility on image tap
  const handleImageTap = () => {
    setShowControls(prev => !prev);
  };

  // Auto-hide controls after 3s
  useEffect(() => {
    if (showControls && open) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    }
    return () => clearTimeout(hideTimerRef.current);
  }, [showControls, open, currentIndex]);

  const handleDelete = async () => {
    if (!currentFile || !onDelete) return;
    try {
      await onDelete(currentFile._id);
      // If last image, close slider
      if (files.length <= 1) {
        onClose();
      } else if (currentIndex >= files.length - 1) {
        setCurrentIndex(i => Math.max(0, i - 1));
      }
    } catch { /* handled upstream */ }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            touchAction: 'none',
          }}
          ref={containerRef}
        >
          {/* ── Top Bar ── */}
          <motion.div
            initial={false}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -60 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 310,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
              paddingTop: 'max(12px, env(safe-area-inset-top))',
              pointerEvents: showControls ? 'auto' : 'none',
            }}
            className="px-3 pb-8"
          >
            <div className="flex items-center justify-between">
              {/* Back button */}
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-lg cursor-pointer"
              >
                <BackArrow />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>

              {/* File info */}
              <div className="text-center flex-1 min-w-0 px-3">
                <p className="text-white text-sm font-semibold truncate">
                  {currentFile?.filename}
                </p>
                <p className="text-white/50 text-xs font-mono">
                  {currentIndex + 1} / {files.length}
                  {currentFile?.size ? ` · ${formatBytes(currentFile.size)}` : ''}
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="text-white/70 hover:text-red-400 transition-colors p-2 -mr-2 rounded-lg cursor-pointer"
                title="Delete photo"
              >
                <TrashIcon />
              </button>
            </div>
          </motion.div>

          {/* ── Image Area (with touch swipe) ── */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={handleImageTap}
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            {currentUrl ? (
              <motion.img
                key={currentFile._id}
                src={currentUrl}
                alt={currentFile?.filename}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: isSwiping ? touchDelta * 0.5 : 0,
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={isSwiping ? { duration: 0 } : { duration: 0.25 }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                }}
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                <p className="text-white/50 text-sm font-medium">Decrypting…</p>
              </div>
            )}

            {/* Desktop arrows — hidden on mobile */}
            {hasPrev && (
              <motion.button
                initial={false}
                animate={{ opacity: showControls ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
              >
                <ChevronLeft />
              </motion.button>
            )}
            {hasNext && (
              <motion.button
                initial={false}
                animate={{ opacity: showControls ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
              >
                <ChevronRight />
              </motion.button>
            )}
          </div>

          {/* ── Bottom Bar ── */}
          <motion.div
            initial={false}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 40 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 310,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              pointerEvents: showControls ? 'auto' : 'none',
            }}
            className="px-4 pt-10"
          >
            {/* Dot indicators for few files, text for many */}
            <div className="flex items-center justify-center gap-1.5 pb-2">
              {files.length <= 10 ? (
                files.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === currentIndex ? 8 : 5,
                      height: i === currentIndex ? 8 : 5,
                      background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                    }}
                  />
                ))
              ) : (
                <p className="text-white/60 text-xs font-mono">
                  {currentIndex + 1} of {files.length}
                </p>
              )}
            </div>

            {currentFile && (
              <p className="text-center text-white/40 text-[10px] font-mono">
                {formatDate(currentFile.uploadedAt)} · 🔐 AES-256 Decrypted
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageSlider;
