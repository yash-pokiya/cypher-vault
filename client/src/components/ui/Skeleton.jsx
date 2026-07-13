export const SkeletonCard = () => (
  <div
    style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
    }}
    className="gallery-card animate-pulse"
  >
    <div className="w-full h-full bg-white/5" />
  </div>
);

export const SkeletonGrid = ({ count = 8 }) => (
  <div className="gallery-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
