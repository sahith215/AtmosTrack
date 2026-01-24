import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Chrome } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';


interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string | void>;
  onResetWithCode: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
}

declare global {
  interface Window {
    google?: any;
  }
}

const AtmosTrackAuthCard: React.FC<LoginFormProps> = ({
  onLogin,
  onSignup,
  onForgotPassword,
  onResetWithCode,
}) => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { login } = useAuth();
  const cardRef = useRef<HTMLDivElement | null>(null);

  // reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignup) {
        await onSignup(form.name, form.email, form.password);
      } else {
        await onLogin(form.email, form.password);
      }
    } catch (err: any) {
      const msg =
        err?.message || 'Unable to sign in. Check your email or password.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleForgotClick = async () => {
    setError(null);

    if (!form.email) {
      const msg = 'Pop in your email first so we know where to send the code.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      const msg =
        (await onForgotPassword(form.email)) ||
        'If an AtmosTrack account exists for this email, a reset code has been sent.';
      showToast(
        msg +
          ' Check your inbox and then drop the code in the box that appears.',
        'info',
      );
      setShowResetModal(true);
    } catch (err: any) {
      const msg =
        err?.message || 'Could not start password reset. Try again.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !resetCode || !newPassword) {
      const msg = 'Email, code, and new password are all required.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      setIsResetSubmitting(true);
      await onResetWithCode(form.email, resetCode.trim(), newPassword);
      showToast(
        'Password updated. Try logging in with your shiny new one.',
        'success',
      );
      setShowResetModal(false);
      setResetCode('');
      setNewPassword('');
    } catch (err: any) {
      const msg =
        err?.message || 'Could not reset password. Double‑check the code.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
  if (
    !window.google ||
    !window.google.accounts ||
    !window.google.accounts.oauth2
  ) {
    showToast('Google SDK not loaded yet. Refresh the page.', 'error');
    return;
  }

  const client = window.google.accounts.oauth2.initTokenClient({
    client_id:
      '995692387798-qnk1n9vr40oour4d6r2gelbg5h6grhh2.apps.googleusercontent.com',
    scope: 'openid email profile',
    callback: async (tokenResponse: any) => {
      console.log('Google tokenResponse =>', tokenResponse);

      if (!tokenResponse?.access_token) {
        showToast('Google did not return an access token.', 'error');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        const data = await res.json();
        console.log('/api/auth/google response =>', data);

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Google sign‑in failed');
        }

        login(data.user, data.token);
        showToast('Signed in with Google.', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Google sign‑in failed', 'error');
      }
    },
  });

  client.requestAccessToken();
};


  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-orange-50 to-cream-100 px-4 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-40 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-60"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-40 bottom-0 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-60"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="relative max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: brand / hero */}
        <div className="space-y-6">
          {/* …left side unchanged… */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/60 border border-orange-200 shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-orange-700 tracking-wide">
              AtmosTrack • Secure Console
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900"
          >
            <span className="block">Welcome to</span>
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
              AtmosTrack
            </span>
            <span className="block text-[22px] sm:text-2xl mt-2 font-semibold text-gray-800">
              Air‑quality intelligence, secured.
            </span>
          </motion.h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-md">
            Sign in to monitor live air quality, health alerts, and carbon‑credit
            flows from every AtmosTrack node across your campus.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/80 rounded-2xl border border-cream-200 p-3 shadow-sm"
            >
              <p className="font-semibold text-gray-800 mb-1">
                Role‑aware access
              </p>
              <p>
                Admins, operators, and viewers each get tailored views of
                AtmosTrack data.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/80 rounded-2xl border border-cream-200 p-3 shadow-sm"
            >
              <p className="font-semibold text-gray-800 mb-1">
                Secure by design
              </p>
              <p>
                Login designed for OTP, email verification, and Google sign‑in
                expansion.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right: auth card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          whileHover={{ y: -4 }}
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-cream-200 p-6 sm:p-8 overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-24 right-0 w-52 h-52 bg-gradient-to-br from-orange-400/20 via-amber-300/10 to-emerald-400/10 blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? 'signup' : 'login'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {isSignup
                      ? 'Create your AtmosTrack account'
                      : 'Welcome back'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {isSignup
                      ? 'Provision access to AtmosTrack devices and dashboards in seconds.'
                      : 'Sign in to continue from your last session.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  {isSignup ? 'Have an account? Sign in' : 'New here? Sign up'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {isSignup && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                      placeholder="you@campus.edu"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                      placeholder={
                        isSignup
                          ? 'Create a strong password'
                          : 'Enter your password'
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isSignup && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          rememberMe
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {rememberMe && (
                          <span className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </button>
                      <span className="text-gray-500">
                        Remember this device
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotClick}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignup && (
                  <p className="text-[11px] text-gray-500">
                    By creating an account, you agree to AtmosTrack’s use of
                    your login data for secure air‑quality analytics.
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  {isSignup
                    ? 'Create AtmosTrack account'
                    : 'Sign in to AtmosTrack'}
                </motion.button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  <Chrome className="w-4 h-4 text-orange-500" />
                  <span>Continue with Google</span>
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* reset modal */}
          <AnimatePresence>
            {showResetModal && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 16, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: -16, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-orange-100 p-6 relative"
                >
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Password failed its vibe check and left the chat? Summon a new one.
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    We emailed a 6‑digit code to{' '}
                    <span className='font-medium'>{form.email}</span>.
                      Drop it in, set a new password, and get back to bullying the atmosphere data like nothing happened.
                  </p>

                  <form onSubmit={handleResetSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Reset code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white tracking-[0.3em] text-center font-mono"
                        placeholder="123456"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">
                        New password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                        placeholder="Make it harder than your exams"
                      />
                    </div>

                    <p className="text-[11px] text-gray-500">
                      Tip: Don&apos;t reuse your old password. Future‑you will
                      thank you.
                    </p>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      disabled={isResetSubmitting}
                      className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isResetSubmitting ? 'Updating password…' : 'Reset password'}
                    </motion.button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AtmosTrackAuthCard;
