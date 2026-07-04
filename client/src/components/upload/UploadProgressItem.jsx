import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatBytes } from '../../utils/formatters';

const STAGE_LABEL = {
  queued:     'Queued',
  encrypting: 'Encrypting…',
  uploading:  'Uploading…',
  done:       'Done',
  error:      'Error',
};

const STAGE_COLOR = {
  queued:     'queued',
  encrypting: 'encrypting',
  uploading:  'default',
  done:       'done',
  error:      'error',
};

const PROGRESS_COLOR = {
  queued:     'default',
  encrypting: 'warning',
  uploading:  'default',
  done:       'success',
  error:      'danger',
};

const UploadProgressItem = ({ item }) => (
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
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    {/* Info + Progress */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
        <p className="upload-item-name">
          {item.file.name}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
            {formatBytes(item.file.size)}
          </span>
          <Badge label={STAGE_LABEL[item.stage]} variant={STAGE_COLOR[item.stage]} />
        </div>
      </div>

      {item.stage !== 'queued' && item.stage !== 'error' && (
        <ProgressBar
          value={item.stage === 'done' ? 100 : item.progress}
          color={PROGRESS_COLOR[item.stage]}
        />
      )}

      {item.error && (
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--danger)' }}>
          {item.error}
        </p>
      )}
    </div>
  </motion.div>
);

export default UploadProgressItem;
