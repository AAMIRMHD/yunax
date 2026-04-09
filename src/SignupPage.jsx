import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
const API = import.meta.env.VITE_API_URL || 'https://yunax.onrender.com';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/products';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="max-w-md mx-auto px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Account</p>
            <h1 className="text-3xl font-semibold">Create Account</h1>
            <p className="text-slate-600">Sign up to save your cart and place orders.</p>
          </motion.div>
          <form className="glass rounded-2xl p-6 border border-slate-200 space-y-4 shadow-md" onSubmit={handleSignup}>
            <div className="text-left space-y-2">
              <label className="text-sm text-slate-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="Your name"
                required
              />
            </div>
            <div className="text-left space-y-2">
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="text-left space-y-2">
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="text-sm text-red-600 text-left">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-md disabled:opacity-70"
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
            <div className="text-sm text-slate-600 text-left">
              Already have an account?{' '}
              <button type="button" className="text-sky-600 hover:underline" onClick={() => (window.location.href = '/login')}>
                Log in
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage;
