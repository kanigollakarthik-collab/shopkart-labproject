import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/format';
import { SparklesIcon, Spinner, AlertTriangleIcon } from '../components/Icons';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // 1. Register customer
      await api.post('/customers/register', formData);
      toast.success('Account created successfully! Logging you in...');

      // 2. Automatically log the new user in for frictionless onboarding
      try {
        await login(formData.email, formData.password);
        navigate('/products', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please try again.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950 relative overflow-hidden">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="card max-w-md w-full p-8 sm:p-10 shadow-2xl relative z-10 animate-fade-up">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-4">
            <SparklesIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create an Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join ShopKart to start shopping with secure payments
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <AlertTriangleIcon className="h-5 w-5 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Aarav Sharma"
              value={formData.fullName}
              onChange={handleChange}
              className="input"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="customer@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              autoComplete="tel"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password (min 6 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="input"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg w-full mt-2 font-bold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner className="h-5 w-5" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-300 hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;