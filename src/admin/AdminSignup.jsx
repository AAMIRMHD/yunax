import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { API } from '../lib/api';

const AdminSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      // Auto-login as admin
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 selection:bg-slate-200 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <a 
          href="/admin/login"
          className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-medium transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Console
        </a>

        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-bold">Registration</p>
          <h1 className="text-3xl font-semibold text-slate-900">Create Admin Account</h1>
          <p className="text-sm text-slate-600">Register as a YunaX Digital administrator.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSignup}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={18} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300"
                placeholder="Admin name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300"
                placeholder="admin@yunax.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-2 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-4 rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-70 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
          >
            {loading ? 'Creating Account…' : 'Create Admin Account'}
          </button>
        </form>

        <div className="text-sm text-slate-500 text-center">
          Already have credentials?{' '}
          <a href="/admin/login" className="text-slate-900 font-bold underline decoration-slate-300 hover:decoration-slate-900 transition-all underline-offset-4">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
