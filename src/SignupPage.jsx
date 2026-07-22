import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { API } from './lib/api';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [notice, setNotice] = useState('');

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
      if (data.requiresVerification) {
        setVerificationPending(true);
        setDevOtp(data.verification?.devOtp || '');
        setNotice(data.verification?.message || 'Verification code sent to your email.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/products';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/products';
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setNotice('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resend code');
      setDevOtp(data.devOtp || '');
      setNotice(data.message || 'Verification code sent again.');
    } catch (err) {
      setError(err.message || 'Could not resend code');
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
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Join the Elite</p>
              <h1 className="text-3xl font-semibold text-slate-900">Create Account</h1>
              <p className="text-slate-600">Start your journey with premium technology.</p>
            </div>
            
            <form className="bg-white rounded-3xl p-8 border border-slate-200 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]" onSubmit={verificationPending ? handleVerifyOtp : handleSignup}>
              {verificationPending && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <ShieldCheck size={18} />
                    Verify your email
                  </div>
                  <p>Enter the six-digit code sent to {email}.</p>
                  {devOtp && <p className="mt-2 font-semibold">Development code: {devOtp}</p>}
                </div>
              )}

              {!verificationPending && (
                <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

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
                <label className="text-sm font-medium text-slate-700 ml-1">Secure Password</label>
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
                </>
              )}

              {verificationPending && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Verification Code</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-[0.3em] outline-none transition focus:border-slate-900"
                    placeholder="000000"
                    required
                  />
                </div>
              )}

              {notice && <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{notice}</div>}
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-4 rounded-xl bg-slate-900 text-white font-semibold shadow-lg hover:bg-slate-800 disabled:opacity-70 transition-all hover:translate-y-[-1px]"
              >
                {loading ? 'Processing…' : verificationPending ? 'Verify & Continue' : 'Create Account'}
              </button>

              {verificationPending && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={resendOtp}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-70 transition"
                >
                  Resend Code
                </button>
              )}

              <div className="text-sm text-slate-600 text-center pt-2">
                Already part of the console?{' '}
                <button type="button" className="text-sky-600 font-semibold hover:underline" onClick={() => (window.location.href = '/login')}>
                  Log in here
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

export default SignupPage;
