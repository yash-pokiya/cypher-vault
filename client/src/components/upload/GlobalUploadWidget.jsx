import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadContext, STAGES } from '../../context/UploadContext';
import { formatBytes, formatSpeed, formatTimeRemaining } from '../../utils/formatters';

export default function GlobalUploadWidget() {
  const location = useLocation();
  const {
    queue,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearQueue,
    hasActiveUploads,
  } = useUploadContext();

  const [minimized, setMinimized] = useState(false);

  const isUploadPage = location.pathname === '/upload';
  if (queue.length === 0 || isUploadPage) return null;

  const activeItems    = queue.filter((i) => [STAGES.PREPARING, STAGES.ENCRYPTING, STAGES.UPLOADING, STAGES.STORING, STAGES.FINALIZING].includes(i.stage));
  const doneItems      = queue.filter((i) => i.stage === STAGES.DONE);
  const errorItems     = queue.filter((i) => i.stage === STAGES.ERROR);

  // Overall progress calculation based on total bytes
  const totalBytesAll = queue.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const loadedBytesAll = queue.reduce((acc, curr) => {
    if (curr.stage === STAGES.DONE) return acc + (curr.size || 0);
    return acc + (curr.loadedBytes || 0);
  }, 0);

  const overallPercentage = totalBytesAll > 0
    ? Math.min(100, Math.round((loadedBytesAll / totalBytesAll) * 100))
    : 0;

  const getStageBadge = (item) => {
    switch (item.stage) {
      case STAGES.PREPARING:
        return { label: 'Preparing… 0%', color: 'var(--text-tertiary)' };
      case STAGES.ENCRYPTING:
        return { label: 'Encrypting photo locally… 10%', color: '#818CF8' };
      case STAGES.UPLOADING:
        return { label: `Uploading to server… ${item.progress}%`, color: 'var(--accent)' };
      case STAGES.STORING:
        return { label: 'Uploading to secure cloud storage…', color: '#EAB308', isSpinning: true };
      case STAGES.FINALIZING:
        return { label: 'Saving encrypted metadata…', color: '#EAB308', isSpinning: true };
      case STAGES.DONE:
        return { label: '✔ Upload Complete', color: '#22c55e' };
      case STAGES.CANCELLED:
        return { label: '✕ Cancelled', color: 'var(--text-tertiary)' };
      case STAGES.ERROR:
        return { label: '⚠️ Upload failed', color: 'var(--danger)' };
      default:
        return { label: item.statusMessage || item.stage, color: 'var(--text-secondary)' };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed bottom-[76px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 w-auto sm:w-[400px] z-[500] overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Header Bar */}
        <div
          onClick={() => setMinimized((m) => !m)}
          style={{
            padding: '12px 16px',
            background: 'var(--surface-input)',
            borderBottom: minimized ? 'none' : '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {hasActiveUploads ? (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent)',
                }}
                className="animate-pulse flex-shrink-0"
              />
            ) : errorItems.length > 0 ? (
              <span style={{ fontSize: 13 }}>⚠️</span>
            ) : (
              <span style={{ fontSize: 13 }}>✅</span>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                {hasActiveUploads
                  ? `Uploading ${activeItems.length} file${activeItems.length > 1 ? 's' : ''}`
                  : doneItems.length > 0
                  ? `Upload complete (${doneItems.length})`
                  : 'Uploads'}
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                {hasActiveUploads
                  ? `${formatBytes(loadedBytesAll)} / ${formatBytes(totalBytesAll)} • Overall ${overallPercentage}%`
                  : `${doneItems.length} completed • ${errorItems.length} failed`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized((m) => !m);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 4,
              }}
              title={minimized ? 'Expand manager' : 'Minimize manager'}
            >
              {minimized ? '▲' : '▼'}
            </button>

            {!hasActiveUploads && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearQueue();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 4,
                }}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Line Bar */}
        {hasActiveUploads && (
          <div style={{ height: 3, background: 'var(--surface-input)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${overallPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent) 0%, #818CF8 100%)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}

        {/* Item Queue Body */}
        {!minimized && (
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 12px' }}>
            {queue.map((item) => {
              const badge = getStageBadge(item);
              const isActive = [STAGES.PREPARING, STAGES.ENCRYPTING, STAGES.UPLOADING, STAGES.STORING, STAGES.FINALIZING].includes(item.stage);
              const speedStr = formatSpeed(item.speed);
              const timeStr  = formatTimeRemaining(item.remainingTime);

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    marginBottom: 6,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                        {item.filename}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {badge.isSpinning && (
                            <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          )}
                          {badge.label}
                        </span>

                        {item.stage === STAGES.UPLOADING && item.loadedBytes > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                            • {formatBytes(item.loadedBytes)} / {formatBytes(item.totalBytes)}
                          </span>
                        )}

                        {speedStr && item.stage === STAGES.UPLOADING && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                            • {speedStr}
                          </span>
                        )}

                        {timeStr && item.stage === STAGES.UPLOADING && (
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                            • {timeStr}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => cancelUpload(item.id)}
                          style={{
                            background: 'var(--danger-subtle)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Cancel upload"
                        >
                          Cancel
                        </button>
                      )}

                      {(item.stage === STAGES.ERROR || item.stage === STAGES.CANCELLED) && (
                        <button
                          type="button"
                          onClick={() => retryUpload(item.id)}
                          style={{
                            background: 'var(--surface-input)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--accent)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Retry upload"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual Item Progress Bar */}
                  {isActive && (
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-input)', overflow: 'hidden', marginTop: 6 }}>
                      <div
                        style={{
                          width: `${item.progress}%`,
                          height: '100%',
                          background: badge.color,
                          transition: 'width 0.15s ease',
                        }}
                      />
                    </div>
                  )}

                  {/* Error detail */}
                  {item.error && item.stage === STAGES.ERROR && (
                    <p style={{ fontSize: 10, color: 'var(--danger)', marginTop: 4, margin: 0 }} className="truncate">
                      {item.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        {!minimized && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--surface-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {hasActiveUploads ? (
              <button
                type="button"
                onClick={clearQueue}
                style={{
                  fontSize: 11,
                  color: 'var(--danger)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel all uploads
              </button>
            ) : (
              <button
                type="button"
                onClick={clearCompleted}
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Clear completed
              </button>
            )}

            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              Zero-Knowledge Encrypted
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
