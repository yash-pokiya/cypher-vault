import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
    if (authError) setAuthError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await login(email, password);
      toast.success('Welcome back!');
      // Wait for React state to update, then route cleanly
      setTimeout(() => {
        if (res?.user?.vaultPasswordSet === false) {
          navigate('/vault-setup', { replace: true });
        } else {
          navigate('/gallery', { replace: true });
        }
      }, 50);
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Invalid email or password';
      setAuthError(serverMessage);
      toast.error(serverMessage);
    }
  };

  return (
    <div
      style={{ background: 'var(--bg-primary)' }}
      className="auth-page transition-colors duration-250 flex items-center justify-center p-4 min-h-screen"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header with Logo + ThemeToggle */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="CYPHER Logo"
              style={{ width: 44, height: 44, objectFit: 'contain' }}
              className="flex-shrink-0 drop-shadow-[0_0_12px_rgba(94,168,255,0.6)]"
            />
            <div>
              <h1
                style={{
                  fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                }}
                className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#818CF8]"
              >
                CYPHER
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Zero-knowledge encrypted storage
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        <div className="auth-card">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Sign in to your account
          </h2>

          {/* Error Banner */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--danger-subtle)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
              }}
              className="mb-5 p-3.5 text-xs font-medium flex items-center gap-2.5"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{authError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              autoFocus
            />

            <Input
              label="Account password"
              type="password"
              placeholder="Enter your account password"
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password !== ' ' ? errors.password : undefined}
            />

            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full btn-full-mobile">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            New to VAULT?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
