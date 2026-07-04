import { motion } from 'framer-motion';

export const SkeletonCard = () => (
  <div
    style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}
    className="relative flex flex-col aspect-square animate-pulse"
  >
    <div className="flex-1 bg-white/5" />
    <div className="p-3 flex items-center justify-between border-t border-[var(--border-default)]">
      <div className="h-3 bg-white/10 rounded w-2/3" />
      <div className="h-3 bg-white/10 rounded w-1/4" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 8 }) => (
  <div className="gallery-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
