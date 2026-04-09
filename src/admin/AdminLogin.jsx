import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://yunax.onrender.com';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to YunaX Console</h1>
          <p className="text-sm text-slate-600">Use your admin credentials to continue.</p>
        </div>

        {error && <div className="text-sm text-red-600 text-center">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center">
          Don’t have an account? <a href="/signup" className="text-slate-900 underline">Create one</a> and then sign in here.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
