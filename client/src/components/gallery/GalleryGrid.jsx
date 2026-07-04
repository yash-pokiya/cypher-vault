import { AnimatePresence, motion } from 'framer-motion';
import ImageCard from './ImageCard';

const GalleryGrid = ({ files, onDelete, selectMode, selectedIds = [], onToggleSelect }) => {
  const safeFiles = Array.isArray(files) ? files : [];

  return (
    <div className="gallery-grid">
      <AnimatePresence>
        {safeFiles.map((file, i) => {
          const selected = selectedIds.includes(file._id);
          return (
            <motion.div
              key={file._id}
              className="w-full min-w-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <ImageCard
                file={file}
                onDelete={onDelete}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={onToggleSelect}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GalleryGrid;
