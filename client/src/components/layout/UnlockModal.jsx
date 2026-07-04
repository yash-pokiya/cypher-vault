import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCryptoContext } from '../../context/CryptoContext';
import { useAuth } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Button from '../ui/Button';

const UnlockModal = () => {
  const { isCryptoReady, initCrypto } = useCryptoContext();
  const { isAuthenticated, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const shouldShow = isAuthenticated && !isCryptoReady;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      initCrypto(password);
      toast.success('Vault unlocked!');
      setPassword('');
    } catch {
      toast.error('Failed to unlock session');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setPassword('');
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="modal-panel max-w-md p-6"
          >
            <div className="modal-handle" />

            <div className="flex flex-col items-center text-center mb-6 mt-1 sm:mt-0">
              <div
                style={{
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Vault Session Locked
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Your master key was purged from memory on page refresh to uphold Zero-Knowledge security.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <Input
                label="Enter password to unlock"
                type="password"
                placeholder="Your vault password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />

              <Button type="submit" loading={loading} size="lg" className="w-full btn-full-mobile">
                🔓 Unlock Vault
              </Button>
            </form>

            <div
              className="mt-5 pt-4 flex items-center justify-between text-xs"
              style={{
                borderTop: '1px solid var(--border-default)',
                color: 'var(--text-tertiary)',
              }}
            >
              <span>Need to switch account?</span>
              <button
                type="button"
                onClick={handleLogout}
                className="font-medium hover:underline transition-colors"
                style={{ color: 'var(--danger)' }}
              >
                Sign out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnlockModal;
