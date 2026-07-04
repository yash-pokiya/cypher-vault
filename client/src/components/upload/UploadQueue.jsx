import { AnimatePresence } from 'framer-motion';
import UploadProgressItem from './UploadProgressItem';

const UploadQueue = ({ queue, onClearCompleted }) => {
  if (queue.length === 0) return null;

  const doneCount = queue.filter((i) => i.stage === 'done').length;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Upload queue ({queue.length})
        </h3>
        {doneCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="text-xs hover:underline transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {queue.map((item) => (
            <UploadProgressItem key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadQueue;
