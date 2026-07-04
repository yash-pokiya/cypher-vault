import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/gif':  ['.gif'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
};

const DropZone = ({ onFiles, disabled = false }) => {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 50 * 1024 * 1024,
    disabled,
    multiple: true,
  });

  const getDropZoneStyle = () => {
    if (isDragReject) {
      return {
        background: 'var(--danger-subtle)',
        borderColor: 'var(--danger)',
        color: 'var(--danger)',
      };
    }
    if (isDragActive) {
      return {
        background: 'var(--accent-subtle)',
        borderColor: 'var(--accent)',
        color: 'var(--accent)',
      };
    }
    return {
      background: 'var(--bg-secondary)',
      borderColor: 'var(--border-strong)',
      color: 'var(--text-primary)',
    };
  };

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: disabled ? 1 : 1.005 }}
      style={{
        ...getDropZoneStyle(),
      }}
      className={[
        'dropzone select-none',
        isDragActive ? 'drag-over' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <input {...getInputProps()} />

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'var(--accent-subtle)',
              border: '2px solid var(--accent)',
              borderRadius: 'var(--radius-xl)',
            }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
        <motion.div
          animate={isDragActive ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{
            background: isDragActive ? 'var(--accent-subtle)' : 'var(--surface-input)',
            borderRadius: 'var(--radius-lg)',
          }}
          className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shadow-xs"
        >
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8"
            style={{ color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </motion.div>

        <div>
          <p className="text-base sm:text-lg font-semibold" style={{ color: isDragActive ? 'var(--accent)' : 'var(--text-primary)' }}>
            {isDragActive ? 'Drop to encrypt & upload' : 'Drop photos here'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            or click to browse · JPEG, PNG, GIF, WebP, AVIF · max 50 MB each
          </p>
        </div>

        <div
          style={{
            background: 'var(--enc-bg)',
            border: '1px solid var(--enc-border)',
            color: 'var(--enc-text)',
            borderRadius: 'var(--radius-full)',
          }}
          className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-mono"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Encrypted in browser · Server sees only ciphertext
        </div>
      </div>

      {isDragReject && (
        <p className="absolute bottom-4 text-xs font-medium" style={{ color: 'var(--danger)' }}>
          Unsupported file type or too large
        </p>
      )}
    </motion.div>
  );
};

export default DropZone;
