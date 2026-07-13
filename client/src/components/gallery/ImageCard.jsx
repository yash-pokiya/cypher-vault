import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCryptoContext } from '../../context/CryptoContext';
import { withSlowNotice } from '../../utils/slowNetworkNotice';
import Spinner from '../ui/Spinner';
import ConfirmModal from '../ui/ConfirmModal';

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ImageCard = ({
  file,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
  thumbnailUrl,     // pre-decrypted URL from batch decrypt
  isDecryptingBatch, // true if batch decrypt is in progress for this file
  onOpenSlider,      // callback to open slider at this file's index
}) => {
  const { isVaultUnlocked } = useCryptoContext();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = useCallback((e) => {
    if (selectMode) {
      e.stopPropagation();
      onToggleSelect?.(file._id);
      return;
    }

    // Open slider if we have a thumbnail
    if (thumbnailUrl && onOpenSlider) {
      onOpenSlider();
      return;
    }
  }, [selectMode, onToggleSelect, file._id, thumbnailUrl, onOpenSlider]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromise = onDelete(file._id);
      await withSlowNotice(deletePromise, 'Deleting from cloud storage…');
      toast.success('✔ Image deleted');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err?.message || 'Unable to delete image.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelect?.(file._id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: isDeleting ? 0.4 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        whileTap={{ scale: isDeleting ? 1 : 0.96 }}
        transition={{ duration: 0.15 }}
        className="gallery-card group relative overflow-hidden cursor-pointer select-none"
        style={{
          background: 'var(--surface-card)',
          border: selected ? '2px solid var(--accent)' : '1px solid var(--border-default)',
          boxShadow: selected ? '0 0 0 2px rgba(94,168,255,0.3)' : 'none',
        }}
        onClick={handleCardClick}
      >
        {/* Square aspect ratio container */}
        <div className="aspect-square relative overflow-hidden w-full">
          <AnimatePresence mode="wait">
            {thumbnailUrl ? (
              <motion.img
                key="img"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={thumbnailUrl}
                alt={file.filename}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <motion.div
                key="lock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, var(--surface-card) 0%, var(--surface-input) 100%)',
                }}
              >
                {isDecryptingBatch ? (
                  <div className="flex flex-col items-center gap-1">
                    <Spinner size="sm" />
                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      Decrypting…
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--surface-input)', border: '1px solid var(--border-default)' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="var(--text-tertiary)" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {isVaultUnlocked ? 'Waiting…' : 'Locked'}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection checkbox — always visible in select mode, hover on desktop */}
          <div
            onClick={handleCheckboxClick}
            className={[
              'absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer z-20',
              selected
                ? 'bg-[var(--accent)] shadow-md'
                : selectMode
                  ? 'bg-black/40 border-2 border-white/80'
                  : 'bg-black/30 border-2 border-white/60 opacity-0 group-hover:opacity-100',
            ].join(' ')}
          >
            {selected ? <CheckIcon /> : null}
          </div>

          {/* Selected overlay */}
          {selected && (
            <div className="absolute inset-0 bg-[var(--accent)]/15 pointer-events-none z-10" />
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Encrypted Photo?"
        message={`"${file.filename}" will be permanently removed from secure cloud storage.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        loading={isDeleting}
        loadingText="Deleting…"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default ImageCard;
