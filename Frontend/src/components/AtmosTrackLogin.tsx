import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Chrome } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import React, { useRef, useState, useEffect } from 'react';
import { API_BASE, GOOGLE_CLIENT_ID } from '../config';

const ADMIN_EMAIL = 'sahith305@gmail.com';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (
    name: string,
    email: string,
    password: string,
    role: 'viewer' | 'operator',
  ) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string | void>;
  onResetWithCode: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  setActiveView: (view: 'home' | 'dashboard' | 'map' | 'health' | 'export' | 'carbon' | 'admin' | 'rootRitual') => void;
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
  setActiveView,
}) => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState<'viewer' | 'operator'>('viewer');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { login } = useAuth();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // ---------- SECRET RITUAL STATE (Layer 1 base) ----------
  const [secretStage, setSecretStage] = useState<number>(0);
  const [viewerClickCount, setViewerClickCount] = useState(0);
  const [stage2Deadline, setStage2Deadline] = useState<number | null>(null);
  const [stage3Deadline, setStage3Deadline] = useState<number | null>(null);
  const [secretTimer, setSecretTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);

  const [showAdminGate, setShowAdminGate] = useState(false);
const [adminStep, setAdminStep] = useState<1 | 2 | 3 | 4>(1);
const [adminInput, setAdminInput] = useState('');
const [adminEmailInput, setAdminEmailInput] = useState('');

  const [breachLines, setBreachLines] = useState<string[]>([]);

useEffect(() => {
  if (!showAdminGate) return;
  const templates = [
    '>> probing node‑03 perimeter…',
    '>> exfiltrating session tokens…',
    '>> forging CO₂ payload frames…',
    '>> rewriting audit trail…',
    '>> escalating privileges on /admin…',
    '>> injecting ghost process into sensor mesh…',
  ];
  const id = setInterval(() => {
    setBreachLines(prev => {
      const next = [
        templates[Math.floor(Math.random() * templates.length)],
        ...prev,
      ].slice(0, 7);
      return next;
    });
  }, 450);
  return () => clearInterval(id);
}, [showAdminGate]);


  const resetSecret = () => {
    if (secretTimer) clearTimeout(secretTimer);
    setSecretTimer(null);
    setSecretStage(0);
    setViewerClickCount(0);
    setStage2Deadline(null);
    setStage3Deadline(null);
  };
  // -------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignup) {
        await onSignup(form.name, form.email, form.password, role);
      } else {
        await onLogin(form.email, form.password);
      }
      resetSecret();
    } catch (err: any) {
      const msg =
        err?.message || 'Unable to sign in. Check your email or password.';
      setError(msg);
      showToast(msg, 'error');
      resetSecret();
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
      resetSecret();
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
      resetSecret();
    } catch (err: any) {
      const msg =
        err?.message || 'Could not reset password. Double‑check the code.';
      setError(msg);
      showToast(msg, 'error');
      resetSecret();
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
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        console.log('Google tokenResponse =>', tokenResponse);

        if (!tokenResponse?.access_token) {
          showToast('Google did not return an access token.', 'error');
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/api/auth/google`, {
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
          resetSecret();
        } catch (err: any) {
          showToast(err?.message || 'Google sign‑in failed', 'error');
          resetSecret();
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
        {/* Left side */}
        <div className="space-y-6">
          {/* KEY A: 3‑second hover on the pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/60 border border-orange-200 shadow-sm"
            onMouseEnter={() => {
              if (secretStage !== 0) return;
              if (secretTimer) {
                clearTimeout(secretTimer);
              }
              const t = setTimeout(() => {
                const now = Date.now();
                setSecretStage(1);
                setStage2Deadline(now + 5000);
                console.log('Key A complete → stage = 1');
                setSecretTimer(null);
              }, 5000);
              setSecretTimer(t);
            }}
            onMouseLeave={() => {
              if (secretStage === 0 && secretTimer) {
                clearTimeout(secretTimer);
                setSecretTimer(null);
              }
            }}
          >
            <span
             className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
             secretStage === 0
             ? 'bg-emerald-500'
             : secretStage === 1 || secretStage === 2
             ? 'bg-red-500'
             : 'bg-black'
  }`}
/>


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
                Admins, operators, and{' '}
                <span
                  onDoubleClick={() => {
                    if (secretStage !== 2) return;
                    const now = Date.now();

                    if (!stage3Deadline) {
                      setStage3Deadline(now + 15000);
                    } else if (now > stage3Deadline) {
                      resetSecret();
                      return;
                    }

                    setViewerClickCount((prev) => {
                      const next = prev + 1;
                      console.log(`Key C progress → ${next}/7`);
                      if (next >= 5) {
                        setSecretStage(3);
                        console.log('Key C complete → stage = 3');
                        setShowAdminGate(true);
                        setAdminStep(1);
                        setAdminInput('');
                      }
                      return next;
                    });
                  }}
                   className="cursor-pointer select-none inline-block"
                >
                  viewers
                </span>{' '}
                each get tailored views of AtmosTrack data.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/80 rounded-2xl border border-cream-200 p-3 shadow-sm"
              onDoubleClick={() => {
                const now = Date.now();
                if (secretStage !== 1 || !stage2Deadline) return;
                if (now > stage2Deadline) {
                  resetSecret();
                  return;
                }
                setSecretStage(2);
                setViewerClickCount(0);
                setStage3Deadline(null);
                console.log('Key B complete → stage = 2');
              }}
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

        
              {showAdminGate ? (
  <motion.div
    className="relative z-15"
    animate={{ opacity: [4, 0.9, 1, 0.95, 1], scale: [1, 1.01, 1] }}
    transition={{ duration: 8.9, repeat: Infinity }}
  >
    {/* moving glitch / noise layers */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-red-950 opacity-90 mix-blend-multiply" />
    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)] opacity-70 animate-pulse" />
    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(248,113,113,0.06)_0px,rgba(248,113,113,0.06)_2px,transparent_2px,transparent_4px)] opacity-70 animate-[ping_3s_infinite]" />

    <div className="relative space-y-4">
      {/* header + tiny countdown */}
      <div className="text-center space-y-1">
        <p className="text-[15px] tracking-[0.50em] text-red-700/100 uppercase animate-pulse">
          unauthorized intrusion detected
        </p>
        <h2 className="text-2xl font-black text-red-100 tracking-[0.35em] uppercase">
          root access
        </h2>
        <p className="text-[11px] text-red-600/80">
          this console is not documented. activity is being recorded.
        </p>
        <p className="text-[10px] text-red-400/80">
          session lock in{' '}
          <span className="animate-pulse">
            05:0{4 - adminStep}
          </span>
        </p>
      </div>

      {/* streaming breach log */}
      <div className="bg-black/95 border border-red-900/80 rounded-xl px-4 py-3 h-32 overflow-hidden text-[10px] font-mono text-red-300/90 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-red-500/80 animate-pulse" />
          <span className="uppercase tracking-[0.18em] text-red-400/80">
            atmos-core://breach
          </span>
          <span className="text-[9px] text-red-500/80 ml-auto">
            ip trace: active
          </span>
        </div>
        <div className="space-y-0.5">
          {breachLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>

      {/* 3‑code input with scary copy */}
      <form
  onSubmit={(e) => {
    e.preventDefault();

    const CODE1 = '0304';
    const CODE2 = '1313';
    const CODE3 = '1907';


    // Steps 1–3: numeric codes
    if (adminStep <= 3) {
      if (adminInput.length !== 4) {
        showToast('ENTER 4 DIGITS TO CONTINUE.', 'error');
        return;
      }

      const wrong =
        (adminStep === 1 && adminInput !== CODE1) ||
        (adminStep === 2 && adminInput !== CODE2) ||
        (adminStep === 3 && adminInput !== CODE3);

      if (wrong) {
        showToast('PATTERN REJECTED. SESSION FLAGGED.', 'error');
        setAdminInput('');
        return;
      }

      if (adminStep < 3) {
        setAdminStep((prev) => (prev === 1 ? 2 : 3));
        setAdminInput('');
        showToast('SIGNATURE ACCEPTED. NEXT FACTOR REQUIRED.', 'success');
      } else {
        // codes 1–3 all passed → move to email factor
        setAdminStep(4);
        setAdminInput('');
        showToast('CODES VERIFIED. IDENTIFY THE ARCHITECT.', 'success');
      }
      return;
    }

    // Step 4: email factor
    if (!adminEmailInput.trim()) {
      showToast('ENTER ADMIN EMAIL TO CONTINUE.', 'error');
      return;
    }

    if (adminEmailInput.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      showToast('IDENTITY REJECTED. THIS SESSION IS NOT YOURS.', 'error');
      setAdminEmailInput('');
      return;
    }

    // Success → redirect to spooky page
    showToast('ROOT IDENTITY VERIFIED. OPENING DEEP LAYER.', 'success');
    console.log('GATE SUCCESS, switching view to rootRitual');

    setActiveView('rootRitual');

  }}
  className="space-y-3 bg-black/95 rounded-xl border border-red-900 shadow-[0_0_60px_rgba(127,29,29,0.7)] px-5 py-4"
>
  <div className="flex items-center justify-between text-[11px] text-red-200">
    <span className="uppercase tracking-[0.22em]">
      factor {adminStep}/4
    </span>
    <span className="text-red-400/80">
      id: atmos-root‑{adminStep.toString().padStart(2, '0')}
    </span>
  </div>

  {adminStep <= 3 ? (
    <input
      type="password"
      inputMode="numeric"
      maxLength={4}
      value={adminInput}
      onChange={(e) =>
        setAdminInput(e.target.value.replace(/[^0-9]/g, ''))
      }
      className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-red-800 text-center tracking-[0.5em] text-red-100 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-red-600/90"
      placeholder="••••"
    />
  ) : (
    <input
      type="email"
      value={adminEmailInput}
      onChange={(e) => setAdminEmailInput(e.target.value)}
      className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-red-800 text-center text-red-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/90"
      placeholder="Enter Your Email to Get Hacked"
    />
  )}

  <button
    type="submit"
    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-800 via-red-600 to-red-700 text-white text-sm font-semibold shadow-lg shadow-red-900/80 hover:shadow-red-700/90 hover:scale-[1.02] transition-all"
  >
    Inject factor
  </button>

  <p className="text-[10px] text-red-400/80 text-center mt-1">
    if you are not the architect, close this window. this event is now
    permanent.
  </p>
</form>
    
    </div>
  </motion.div>
) : (
  // ---------- NORMAL LAYER‑1 FORM ----------
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
                    onClick={() => {
                      setIsSignup(!isSignup);
                      resetSecret();
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    {isSignup
                      ? 'Have an account? Sign in'
                      : 'New here? Sign up'}
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 relative z-10"
                >
                  {isSignup && (
                    <>
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

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          value={role}
                          onChange={(e) =>
                            setRole(e.target.value as 'viewer' | 'operator')
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="operator">Operator</option>
                        </select>
                      </div>
                    </>
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
          )}

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
                    onClick={() => {
                      setShowResetModal(false);
                      resetSecret();
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Password failed its vibe check and left the chat? Summon a
                    new one.
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    We emailed a 6‑digit code to{' '}
                    <span className="font-medium">{form.email}</span>. Drop it
                    in, set a new password, and get back to bullying the
                    atmosphere data like nothing happened.
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
                      Tip: Do not reuse your old password. Future‑you will thank
                      you.
                    </p>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      disabled={isResetSubmitting}
                      className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isResetSubmitting
                        ? 'Updating password…'
                        : 'Reset password'}
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
