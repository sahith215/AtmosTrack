import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE } from '../config';

type Props = {
  open: boolean;
  onClose: () => void;
};

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmailModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Auto-request a code whenever the modal opens (fresh open)
  useEffect(() => {
    if (open && user?.email && !codeSent) {
      requestCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCode('');
      setCodeSent(false);
      setCooldown(0);
    }
  }, [open]);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const requestCode = async () => {
    if (!user?.email || sending || cooldown > 0) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCodeSent(true);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        showToast('Verification code sent — check your inbox!', 'info');
      } else {
        showToast(data.error || 'Failed to send code. Try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!user?.email || code.trim().length < 6) {
      showToast('Please enter the full 6-digit code.', 'error');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || 'Invalid or expired code. Try again.', 'error');
        setVerifying(false);
        return;
      }

      // Refresh the JWT so emailVerified:true flows into context immediately
      const updated = await refreshUser();
      if (updated?.emailVerified) {
        showToast('✅ Email verified! All features are now unlocked.', 'success');
        setCode('');
        setCodeSent(false);
        onClose();
      } else {
        showToast('Verified! Please refresh if features are still locked.', 'info');
        onClose();
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Handle Enter key in code input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !verifying) {
      handleVerify();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden"
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          {/* Gradient header bar */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400" />

          <div className="p-7 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Verify your email</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Required to unlock premium features</p>
                </div>
              </div>
              <button
                onClick={() => { setCode(''); setCodeSent(false); onClose(); }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info box */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 space-y-1">
              <p className="text-sm text-gray-700">
                A 6-digit code was sent to{' '}
                <span className="font-semibold text-orange-700">{user?.email}</span>
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                <li>• Check your Promotions or Spam folder if you don't see it</li>
                <li>• Codes expire in 15 minutes</li>
              </ul>
            </div>

            {/* Code input */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-4 border-2 rounded-2xl text-center text-3xl font-bold tracking-[0.6em] font-mono
                    focus:outline-none transition-all duration-200
                    ${code.length === 6
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-orange-400 focus:bg-orange-50/30'
                    }`}
                  autoFocus
                />
                {code.length === 6 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </div>

              {/* Verify button */}
              <motion.button
                onClick={handleVerify}
                disabled={verifying || code.length < 6}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${verifying || code.length < 6
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.01]'
                  }`}
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-orange-300 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Email
                  </>
                )}
              </motion.button>
            </div>

            {/* Resend row */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={requestCode}
                  disabled={sending || cooldown > 0}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors
                    ${sending || cooldown > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-orange-500 hover:text-orange-700'
                    }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                  {sending ? 'Sending…' : codeSent ? 'Resend code' : 'Send code'}
                </button>
                {cooldown > 0 && (
                  <span className="text-xs text-gray-400">
                    (wait {cooldown}s)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Features like Carbon Hub &amp; Exports require this
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerifyEmailModal;
