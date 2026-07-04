import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmptyGallery = ({ folderId }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 px-8 text-center"
  >
    <div
      style={{
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-xl)',
      }}
      className="w-20 h-20 flex items-center justify-center mb-6"
    >
      <svg
        className="w-10 h-10"
        style={{ color: 'var(--accent)' }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
      No encrypted photos yet
    </h3>
    <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
      Upload your first photo. It will be encrypted in your browser before leaving your device — the server never sees the original.
    </p>
    <Link
      to={folderId ? `/upload?folderId=${folderId}` : '/upload'}
      style={{
        background: 'var(--accent)',
        color: 'var(--text-on-accent)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Upload photos
    </Link>
  </motion.div>
);

export default EmptyGallery;
