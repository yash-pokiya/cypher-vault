import { motion, AnimatePresence } from 'framer-motion';
import { useUploadContext } from '../../context/UploadContext';

export default function LeaveConfirmationModal() {
  const { showLeaveModal, confirmLeave, cancelLeave } = useUploadContext();

  if (!showLeaveModal) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 24,
            boxShadow: 'var(--shadow-modal)',
            padding: '28px 24px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--danger-subtle)',
              border: '1px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
            }}
          >
            ⚠️
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Upload in Progress
          </h3>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24 }}>
            Your photos are still being encrypted and uploaded. Leaving now will cancel the active upload process.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Default Option: Stay Here */}
            <button
              type="button"
              onClick={cancelLeave}
              autoFocus
              style={{
                width: '100%',
                height: 44,
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Stay Here
            </button>

            {/* Cancel Upload & Leave */}
            <button
              type="button"
              onClick={confirmLeave}
              style={{
                width: '100%',
                height: 40,
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Upload & Leave
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
