import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

const LOGO_URL =
  'https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png';

const Navbar = ({ search, setSearch }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isGallery = location.pathname.startsWith('/gallery');

  return (
    <nav className="navbar">
      {/* Brand Logo & Name — hidden on desktop/laptop where Sidebar logo is visible */}
      <Link className="navbar-logo flex items-center gap-3 group lg:hidden" to="/gallery">
        <img
          src={LOGO_URL}
          alt="CYPHER Logo"
          style={{ width: 46, height: 46, objectFit: 'contain' }}
          className="drop-shadow-[0_0_14px_rgba(94,168,255,0.6)] group-hover:scale-105 transition-transform duration-200"
        />
        <span
          style={{
            fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
          className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#818CF8] drop-shadow-[0_0_10px_rgba(94,168,255,0.4)]"
        >
          CYPHER
        </span>
      </Link>

      {/* Search bar — hidden on mobile */}
      {isGallery && setSearch ? (
        <div className="navbar-search ml-4">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search encrypted photos by name…"
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--surface-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm outline-none focus:border-[var(--border-focus)] transition-colors"
            />
          </div>
        </div>
      ) : (
        <div className="navbar-search ml-4">
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>
            Zero-Knowledge Storage
          </span>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/upload"
          className="navbar-upload-btn hover:opacity-90 transition-opacity"
          title="Upload photo"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="navbar-upload-text">Upload</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Badge */}
        {user && (
          <div
            style={{
              background: 'var(--accent-subtle)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent)',
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
            }}
            className="border flex items-center justify-center text-sm font-bold select-none flex-shrink-0"
            title={user.name}
          >
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
