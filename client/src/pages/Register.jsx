import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { passwordStrength, strengthLabel } from '../utils/validators';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const score = passwordStrength(form.password);
  const strength = strengthLabel(score);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 12) e.password = 'Min 12 characters';
    if (!/[A-Z]/.test(form.password)) e.password = 'Must include an uppercase letter';
    if (!/[0-9]/.test(form.password)) e.password = 'Must include a number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Set up your vault password.');
      navigate('/vault-setup');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page transition-colors duration-250">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
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
            Create account
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Full name" type="text" placeholder="Jane Doe" value={form.name} onChange={set('name')} error={errors.name} autoFocus />
            <Input label="Email address" type="email" placeholder="jane@example.com" value={form.email} onChange={set('email')} error={errors.email} />
            <div>
              <Input label="Account password" type="password" placeholder="Min 12 chars, 1 uppercase, 1 number" value={form.password} onChange={set('password')} error={errors.password} />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4,5,6].map((i) => (
                      <div
                        key={i}
                        className="h-1 rounded-full flex-1 transition-colors"
                        style={{
                          background:
                            i <= score
                              ? score <= 2
                                ? 'var(--danger)'
                                : score <= 4
                                ? 'var(--warning)'
                                : 'var(--success)'
                              : 'var(--border-default)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
            <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />

            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full btn-full-mobile">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
