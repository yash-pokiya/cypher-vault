import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatBytes, formatSpeed, formatTimeRemaining } from '../../utils/formatters';
import { useUploadContext, STAGES } from '../../context/UploadContext';

const STAGE_LABEL = {
  preparing: 'Preparing… 0%',
  encrypting: 'Encrypting photo locally… 10%',
  uploading: 'Uploading to server…',
  storing: 'Uploading to secure cloud storage…',
  finalizing: 'Saving encrypted metadata…',
  done: '✔ Upload Complete',
  cancelled: '✕ Cancelled',
  error: '⚠️ Upload failed',
};

const STAGE_COLOR = {
  preparing: 'queued',
  encrypting: 'encrypting',
  uploading: 'default',
  storing: 'warning',
  finalizing: 'warning',
  done: 'done',
  cancelled: 'queued',
  error: 'error',
};

const PROGRESS_COLOR = {
  preparing: 'default',
  encrypting: 'warning',
  uploading: 'default',
  storing: 'warning',
  finalizing: 'warning',
  done: 'success',
  cancelled: 'default',
  error: 'danger',
};

const UploadProgressItem = ({ item }) => {
  const { cancelUpload, retryUpload } = useUploadContext();

  const isActive = [STAGES.PREPARING, STAGES.ENCRYPTING, STAGES.UPLOADING, STAGES.STORING, STAGES.FINALIZING].includes(item.stage);
  const isFailed = item.stage === STAGES.ERROR || item.stage === STAGES.CANCELLED;
  const isSpinning = item.stage === STAGES.STORING || item.stage === STAGES.FINALIZING;

  const speedStr = formatSpeed(item.speed);
  const timeStr = formatTimeRemaining(item.remainingTime);
  const stageLabel = item.stage === STAGES.UPLOADING
    ? `Uploading to server… ${item.progress}%`
    : STAGE_LABEL[item.stage] || item.stage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="upload-item"
    >
      {/* File icon */}
      <div
        style={{
          background: 'var(--surface-input)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
        }}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0"
      >
        {isSpinning ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Info + Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="upload-item-name truncate">
              {item.filename || item.file?.name}
            </p>
            {item.stage === STAGES.UPLOADING && item.loadedBytes > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {formatBytes(item.loadedBytes)} / {formatBytes(item.totalBytes)}
                {speedStr && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> • {speedStr}</span>}
                {timeStr && <span> • {timeStr}</span>}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge label={stageLabel} variant={STAGE_COLOR[item.stage] || 'default'} />

            {isActive && (
              <button
                type="button"
                onClick={() => cancelUpload(item.id)}
                style={{ color: 'var(--danger)' }}
                className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-red-500/15 transition-colors"
                title="Cancel upload"
              >
                Cancel
              </button>
            )}

            {isFailed && (
              <button
                type="button"
                onClick={() => retryUpload(item.id)}
                style={{ color: 'var(--accent)' }}
                className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-[var(--accent-subtle)] transition-colors"
                title="Retry upload"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {item.stage !== STAGES.PREPARING && item.stage !== STAGES.ERROR && item.stage !== STAGES.CANCELLED && (
          <ProgressBar
            value={item.stage === STAGES.DONE ? 100 : item.progress}
            color={PROGRESS_COLOR[item.stage]}
          />
        )}

        {item.error && (
          <p className="text-xs mt-1 truncate" style={{ color: item.stage === STAGES.CANCELLED ? 'var(--text-tertiary)' : 'var(--danger)' }}>
            {item.error}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default UploadProgressItem;
