import { AnimatePresence, motion } from 'framer-motion';
import ImageCard from './ImageCard';

const GalleryGrid = ({
  files,
  onDelete,
  selectMode,
  selectedIds = [],
  onToggleSelect,
  thumbnails = {},
  decryptingFileIds = new Set(),
  onOpenSlider,
}) => {
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
            >
              <ImageCard
                file={file}
                onDelete={onDelete}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={onToggleSelect}
                thumbnailUrl={thumbnails[file._id] || null}
                isDecryptingBatch={decryptingFileIds.has?.(file._id)}
                onOpenSlider={() => onOpenSlider?.(i)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GalleryGrid;
