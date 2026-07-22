import { useState } from 'react';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Key, Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { API } from './lib/api';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUserNotFound(false);

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'USER_NOT_FOUND' || res.status === 404) {
          setUserNotFound(true);
        }
        throw new Error(data.error || 'Could not send verification code.');
      }
      
      setSuccess(data.message || 'Verification code sent to your email.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP.');
      
      setResetToken(data.resetToken);
      setSuccess('Verification code verified successfully.');
      setStep('password');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset password.');
      
      setStep('success');
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for showing current step indicator
  const getStepNumber = () => {
    if (step === 'email') return 1;
    if (step === 'otp') return 2;
    if (step === 'password') return 3;
    return 4;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-100 flex flex-col justify-between">
      <Navbar />
      
      <main className="pt-32 pb-20 flex-grow flex items-center justify-center">
        <section className="w-full max-w-lg px-6">
          <div className="space-y-6">
            
            {/* Back to Sign In Link */}
            {step !== 'success' && (
              <button
                type="button"
                onClick={() => (window.location.href = '/login')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            )}

            {/* Form Header */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-500">Security Center</span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reset Your Password</h1>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {step === 'email' && "Enter your registered email address to receive a 6-digit confirmation code."}
                {step === 'otp' && `We've sent a 6-digit confirmation code to ${email}.`}
                {step === 'password' && "Set a strong, secure new password for your YunaX account."}
                {step === 'success' && "Your password has been successfully updated."}
              </p>
            </div>

            {/* Multi-step progress bar */}
            {step !== 'success' && (
              <div className="flex items-center justify-between max-w-xs mx-auto pt-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center flex-1 last:flex-none">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      getStepNumber() >= num 
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20' 
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}>
                      {num}
                    </div>
                    {num < 3 && (
                      <div className={`h-[2px] flex-grow mx-2 transition-all duration-300 ${
                        getStepNumber() > num ? 'bg-slate-900' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Step Content container */}
            <div className="rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/35 relative overflow-hidden">
              
              {/* Notifications */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-700"
                >
                  {userNotFound ? (
                    <div className="space-y-1">
                      <p>
                        The email is not registered. Do you want to{' '}
                        <a href="/signup" className="text-red-950 font-bold hover:underline">
                          create an account
                        </a>?
                      </p>
                    </div>
                  ) : (
                    error
                  )}
                </motion.div>
              )}

              {success && step !== 'password' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-medium text-emerald-700"
                >
                  {success}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                
                {/* Step 1: Email Request */}
                {step === 'email' && (
                  <motion.form
                    key="step-email"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleSendOtp}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none transition focus:border-slate-900 focus:bg-slate-50/50"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>
                  </motion.form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 'otp' && (
                  <motion.form
                    key="step-otp"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Verification Code</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 text-center tracking-[0.5em] text-lg font-bold outline-none transition focus:border-slate-900 focus:bg-slate-50/50"
                          placeholder="000000"
                          required
                        />
                      </div>
                    </div>

                    {devOtp && (
                      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-center">
                        <span className="text-xs text-sky-700 font-medium block mb-1">Development mode helper:</span>
                        <code className="text-sm font-bold bg-sky-100/80 px-3 py-1 rounded-md text-sky-800 tracking-wider">
                          {devOtp}
                        </code>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
                      >
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Step 3: Password Update */}
                {step === 'password' && (
                  <motion.form
                    key="step-password"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleResetPassword}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:border-slate-900 outline-none transition focus:bg-slate-50/50"
                          placeholder="••••••••"
                          required
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-2" onClick={() => setShowPassword((v) => !v)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:border-slate-900 outline-none transition focus:bg-slate-50/50"
                          placeholder="••••••••"
                          required
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-2" onClick={() => setShowConfirm((v) => !v)}>
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </motion.form>
                )}

                {/* Step 4: Success confirmation */}
                {step === 'success' && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shadow-sm">
                        <ShieldCheck size={36} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-slate-900">Success!</h2>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Your password has been successfully reset. You can now use your new password to sign in to your account.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => (window.location.href = '/login')}
                      className="w-full rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98]"
                    >
                      Sign In Now
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
