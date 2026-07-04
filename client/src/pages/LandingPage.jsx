import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const LOGO_URL =
  'https://res.cloudinary.com/dsncsvgfm/image/upload/v1783154773/Gemini_Generated_Image_u7z23gu7z23gu7z2-removebg-preview_ylpmqd.png';

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="landing-root">
      {/* ── NAVBAR ───────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          {/* Logo */}
          <a href="/" className="landing-logo">
            <img
              src={LOGO_URL}
              alt="CYPHER Logo"
              style={{ width: 34, height: 34, objectFit: 'contain' }}
              className="landing-logo-img"
            />
            <span
              className="landing-logo-text"
              style={{
                fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              CYPHER
            </span>
          </a>

          {/* Nav links — hidden on mobile */}
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">
              Features
            </a>
            <a href="#security" className="landing-nav-link">
              Security
            </a>
            <a href="#how" className="landing-nav-link">
              How it works
            </a>
          </div>

          {/* Right actions */}
          <div className="landing-nav-actions">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="landing-theme-btn"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <Link to="/login" className="landing-btn-ghost">
              Sign in
            </Link>
            <Link to="/register" className="landing-btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container">
          {/* Badge */}
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Zero-knowledge encryption
          </div>

          {/* Headline */}
          <h1 className="landing-h1">
            Your photos,
            <br />
            <span className="landing-h1-accent">invisible to everyone</span>
            <br />
            but you
          </h1>

          {/* Subtext */}
          <p className="landing-subtext">
            CYPHER encrypts every photo inside your browser before it ever leaves your device. Not even we can see your
            images.
          </p>

          {/* CTA buttons */}
          <div className="landing-cta-row">
            <Link to="/register" className="landing-cta-primary">
              Start for free
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a href="#how" className="landing-cta-secondary">
              See how it works
            </a>
          </div>

          {/* Trust line */}
          <p className="landing-trust">AES-256-GCM encryption · Open architecture · Zero-knowledge privacy</p>

          {/* Hero visual — browser mockup */}
          <div className="landing-mockup">
            <div className="landing-mockup-bar">
              <div className="landing-mockup-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-mockup-url">cyphervault.vercel.app/gallery</div>
            </div>
            <div className="landing-mockup-body">
              <div className="landing-mockup-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="landing-mockup-cell">
                    <img
                      src={LOGO_URL}
                      alt="CYPHER Icon"
                      style={{ width: 28, height: 28, opacity: 0.85, objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
              <div className="landing-mockup-label">All photos encrypted · CYPHER Vault locked</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <h2 className="landing-h2">Built for privacy, not surveillance</h2>
          <p className="landing-section-sub">Every decision in CYPHER is made with one principle: your data is yours.</p>

          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                  {f.icon}
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="landing-section landing-section-alt" id="how">
        <div className="landing-container">
          <h2 className="landing-h2">How CYPHER protects your photos</h2>
          <p className="landing-section-sub">Three steps. All encryption happens in your browser.</p>

          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="landing-step">
                <div className="landing-step-num">{i + 1}</div>
                <div className="landing-step-content">
                  <h3 className="landing-step-title">{s.title}</h3>
                  <p className="landing-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ─────────────────────────── */}
      <section className="landing-section" id="security">
        <div className="landing-container">
          <h2 className="landing-h2">Security you can verify</h2>
          <p className="landing-section-sub">No security theater. Real, auditable zero-knowledge encryption.</p>

          <div className="landing-security-grid">
            {SECURITY_POINTS.map((s) => (
              <div key={s.label} className="landing-security-item">
                <div className="landing-security-check">✓</div>
                <div>
                  <div className="landing-security-label">{s.label}</div>
                  <div className="landing-security-detail">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ───────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2">Ready to take back your privacy?</h2>
          <p className="landing-section-sub">Free to start. No credit card. No tracking.</p>
          <Link to="/register" className="landing-cta-primary" style={{ display: 'inline-flex', marginTop: 8 }}>
            Create your vault
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-logo" style={{ textDecoration: 'none' }}>
            <img
              src={LOGO_URL}
              alt="CYPHER Logo"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              className="landing-logo-img"
            />
            <span
              className="landing-logo-text"
              style={{
                fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              CYPHER
            </span>
          </div>
          <p className="landing-footer-copy">© {new Date().getFullYear()} CYPHER · All photos encrypted client-side</p>
          <div className="landing-footer-links">
            <Link to="/login" className="landing-footer-link">
              Sign in
            </Link>
            <Link to="/register" className="landing-footer-link">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Static data ─────────────────────────────────────────────── */

const FEATURES = [
  {
    title: 'Client-side encryption',
    desc: 'Images are encrypted in your browser using AES-256-GCM before any data leaves your device.',
    icon: '🔐',
    iconBg: 'var(--accent-subtle)',
    iconColor: 'var(--accent)',
  },
  {
    title: 'Zero-knowledge design',
    desc: 'We never see your vault password, encryption keys, or original photos. Mathematically impossible.',
    icon: '🧠',
    iconBg: 'var(--success-subtle)',
    iconColor: 'var(--success)',
  },
  {
    title: 'Organized with folders',
    desc: 'Group your encrypted photos into folders. Moving files between folders never touches the encryption.',
    icon: '📁',
    iconBg: 'var(--warning-subtle)',
    iconColor: 'var(--warning)',
  },
  {
    title: 'Secure across devices',
    desc: 'Your vault password derives the same master key on any device. Photos decrypt anywhere you log in.',
    icon: '📱',
    iconBg: 'var(--accent-subtle)',
    iconColor: 'var(--accent)',
  },
  {
    title: 'Session persistence',
    desc: 'Stay unlocked for up to 24 hours per session. Vault auto-locks when you close your tab.',
    icon: '⏱',
    iconBg: 'var(--success-subtle)',
    iconColor: 'var(--success)',
  },
  {
    title: 'Instant preview',
    desc: 'Hover over a photo to start decrypting in the background. Tap to view instantly.',
    icon: '⚡',
    iconBg: 'var(--warning-subtle)',
    iconColor: 'var(--warning)',
  },
];

const STEPS = [
  {
    title: 'Upload your photo',
    desc: 'Drag and drop or select photos. CYPHER generates a unique random key for each image and encrypts it in your browser using AES-256-GCM.',
  },
  {
    title: 'Your vault password wraps the keys',
    desc: "Your vault password (via PBKDF2) creates a master key that wraps each photo's encryption key. Only you can unwrap them.",
  },
  {
    title: 'Encrypted blob goes to the cloud',
    desc: 'Only encrypted binary data reaches Cloudinary. No one — including us — can read your photos without your vault password.',
  },
];

const SECURITY_POINTS = [
  { label: 'AES-256-GCM per file', detail: 'Every photo gets its own unique 256-bit key' },
  { label: 'PBKDF2 key derivation', detail: '310,000 iterations, SHA-256, unique salt per file' },
  { label: 'Keys never leave your browser', detail: 'Master key exists only in browser memory during session' },
  { label: 'Cloudinary stores ciphertext', detail: 'Encrypted blobs only — Cloudinary cannot read your photos' },
  { label: 'MongoDB stores wrapped keys', detail: 'Only encrypted key material in database — useless without vault password' },
  { label: 'Session auto-expires', detail: 'Vault locks automatically after your chosen session duration' },
];
