import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useSessionActivity } from '../../hooks/useSessionActivity';

export default function Layout({ children, search, setSearch }) {
  useSessionActivity();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100vw',
      maxWidth: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Sticky top navbar */}
      <Navbar search={search} setSearch={setSearch} />

      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Sidebar — hidden on mobile via CSS class */}
        <aside className="app-sidebar">
          <Sidebar />
        </aside>

        {/* Page content */}
        <main className="app-main">
          {children}
        </main>
      </div>

      {/* Bottom nav — visible ONLY on mobile via CSS class */}
      <BottomNav />
    </div>
  );
}
