import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const API_BASE = 'http://localhost:5000';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !token) {
      setError('Reset link is invalid.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const msg = data.error || 'Password reset failed.';
        setError(msg);
        showToast(msg, 'error');
        return;
      }

      showToast('Password updated. You can now sign in.', 'success');
      navigate('/'); // back to login
    } catch (err: any) {
      const msg = err?.message || 'Password reset failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-cream-200"
      >
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Reset your AtmosTrack password
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          Set a new password for <span className="font-mono">{email}</span>.
        </p>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          New password
        </label>
        <input
          type="password"
          className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Confirm new password
        </label>
        <input
          type="password"
          className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md disabled:opacity-70"
        >
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
