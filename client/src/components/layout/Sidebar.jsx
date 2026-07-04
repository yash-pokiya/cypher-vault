import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useCryptoContext } from '../../context/CryptoContext';
import { useStorage } from '../../hooks/useStorage';
import { useEffect } from 'react';
import { formatBytes } from '../../utils/formatters';

const NavLink = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`sidebar-item ${active ? 'active' : ''}`}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="sidebar-label">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { clearCrypto } = useCryptoContext();
  const { stats, fetchStats } = useStorage();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleLogout = async () => {
    clearCrypto();
    await logout();
  };

  const usedBytes = stats?.totalEncryptedBytes || 0;
  const limitBytes = stats?.cloudinary?.storageLimitBytes || 0;
  const usedPct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return (
    <div
      style={{
        background: 'var(--surface-sidebar)',
        borderRight: '1px solid var(--border-default)',
      }}
      className="flex flex-col h-full p-3 lg:p-4 transition-colors duration-250 w-full"
    >
      {/* Logo */}
      <Link to="/gallery" className="flex items-center gap-2.5 px-1 lg:px-2 mb-6 lg:mb-8 group">
        <img
          src="https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png"
          alt="CYPHER Logo"
          className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-[0_0_10px_rgba(94,168,255,0.5)] group-hover:scale-105 transition-transform"
        />
        <span
          style={{
            fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
          className="sidebar-label uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#818CF8]"
        >
          CYPHER
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavLink
          to="/gallery"
          label="Gallery"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <NavLink
          to="/upload"
          label="Upload"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        />
        <NavLink
          to="/profile"
          label="Profile"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </nav>

      {/* Storage Widget — desktop only */}
      {stats && (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
          className="mt-4 p-3 shadow-xs sidebar-label"
        >
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            <span>Storage</span>
            <span>{stats.fileCount} files</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--progress-track)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--progress-fill)' }}
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatBytes(usedBytes)} used
          </p>
        </div>
      )}

      {/* User + Logout */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-3 px-1 lg:px-2 py-2">
          <div
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            title={user?.name}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0 sidebar-label">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          className="mt-1 w-full flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-1.5 text-xs hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
          title="Sign out"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="sidebar-label">Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
