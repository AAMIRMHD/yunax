import { useMemo, useState } from 'react';
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { API } from '../lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateAdminLogin = ({ email, password }) => {
  const nextErrors = {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail) {
    nextErrors.email = 'Admin email is required.';
  } else if (!emailPattern.test(normalizedEmail)) {
    nextErrors.email = 'Enter a valid admin email address.';
  }

  if (!normalizedPassword) {
    nextErrors.password = 'Password is required.';
  } else if (normalizedPassword.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.';
  } else if (normalizedPassword.length > 72) {
    nextErrors.password = 'Password must be 72 characters or less.';
  }

  return nextErrors;
};

const clearAdminSession = () => {
  try {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  } catch (err) {
    // Ignore storage failures; failed sessions should not block the form.
  }
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const runValidation = (nextValues = { email, password }) => {
    const nextErrors = validateAdminLogin(nextValues);
    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    clearAdminSession();

    const nextErrors = runValidation({ email, password });
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const validationMessage = Array.isArray(data?.errorObj?.details) ? data.errorObj.details[0]?.message : '';
        throw new Error(validationMessage || data.error || 'Invalid admin email or password.');
      }

      if (!data?.token || data?.user?.role !== 'admin') {
        throw new Error('This account is not authorized for admin access.');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!normalizedEmail) {
      setTouched((current) => ({ ...current, email: true }));
      setFieldErrors((current) => ({ ...current, email: 'Enter your admin email first.' }));
      return;
    }
    setError('Password reset is not available yet. Contact the server owner.');
  };

  const inputBaseClass =
    'w-full px-4 py-3 rounded-xl border bg-white transition outline-none focus:ring-4 focus:ring-slate-100';

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
          <button
            onClick={() => {
              setIsResetMode(false);
              setResetSent(false);
              setError('');
            }}
            className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm transition"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
            <p className="text-sm text-slate-600">Enter your admin email to receive a recovery link.</p>
          </div>

          {!resetSent ? (
            <form className="space-y-4" onSubmit={handleResetRequest} noValidate>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 font-medium">Email</label>
                <input
                  type="email"
                  className={`${inputBaseClass} ${touched.email && fieldErrors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400'}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) runValidation({ email: e.target.value, password });
                  }}
                  onBlur={() => {
                    markTouched('email');
                    runValidation({ email, password });
                  }}
                  placeholder="admin@yunax.com"
                  required
                />
                {touched.email && fieldErrors.email && <p className="text-xs text-rose-600">{fieldErrors.email}</p>}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-70 transition shadow-lg shadow-slate-200"
                disabled={loading}
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <ArrowLeft size={24} className="rotate-180" />
              </div>
              <h3 className="font-semibold text-emerald-900">Email Sent!</h3>
              <p className="text-sm text-emerald-700">Please check your inbox at {normalizedEmail} for instructions to reset your password.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to YunaX Console</h1>
          <p className="text-sm text-slate-600">Use your verified admin credentials to continue.</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 font-medium">Admin Email</label>
            <input
              type="email"
              aria-invalid={Boolean(touched.email && fieldErrors.email)}
              aria-describedby={touched.email && fieldErrors.email ? 'admin-email-error' : undefined}
              className={`${inputBaseClass} ${touched.email && fieldErrors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400'}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) runValidation({ email: e.target.value, password });
              }}
              onBlur={() => {
                markTouched('email');
                runValidation({ email, password });
              }}
              placeholder="admin@yunax.com"
              autoComplete="email"
              required
            />
            {touched.email && fieldErrors.email && <p id="admin-email-error" className="text-xs text-rose-600">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 font-medium">Password</label>
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                Forgot Password?
              </button>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                aria-invalid={Boolean(touched.password && fieldErrors.password)}
                aria-describedby={touched.password && fieldErrors.password ? 'admin-password-error' : undefined}
                className={`${inputBaseClass} pr-11 ${touched.password && fieldErrors.password ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400'}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) runValidation({ email, password: e.target.value });
                }}
                onBlur={() => {
                  markTouched('password');
                  runValidation({ email, password });
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.password && fieldErrors.password && <p id="admin-password-error" className="text-xs text-rose-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-70 transition shadow-lg shadow-slate-200"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center">
          Admin access is restricted to approved and verified administrator accounts.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
