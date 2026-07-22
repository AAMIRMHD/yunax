import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { API } from './lib/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen selection:bg-sky-100">
      <Navbar />
      <main className="pt-32 pb-16">
        <section className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Welcome Back</p>
              <h1 className="text-3xl font-semibold text-slate-900">Sign In</h1>
              <p className="text-slate-600">Access your personalized tech experience.</p>
            </div>

            <form className="bg-white rounded-3xl p-8 border border-slate-200 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => (window.location.href = '/forgot-password')}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-4 rounded-xl bg-slate-900 text-white font-semibold shadow-lg hover:bg-slate-800 disabled:opacity-70 transition-all hover:translate-y-[-1px]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-sm text-slate-600 text-center pt-2">
                Don't have an account?{' '}
                <button type="button" className="text-sky-600 font-semibold hover:underline" onClick={() => (window.location.href = '/signup')}>
                  Create An Account
                </button>
              </div>
            </form>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
