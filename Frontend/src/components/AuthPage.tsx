import AtmosTrackAuthCard from '../components/AtmosTrackLogin';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const API_BASE = 'http://localhost:5000';

const AuthPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 401) throw new Error('Incorrect password');
    if (res.status === 404)
      throw new Error('No account found for this email. Create one first.');
    if (!res.ok) throw new Error('Login failed. Please try again.');

    const data = await res.json();
    login(data.user, data.token);
    showToast('Signed in successfully.', 'success');
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      throw new Error('Could not create account. Try another email.');
    }

    const data = await res.json();
    login(data.user, data.token);
    showToast('Account created successfully.', 'success');
  };

  const handleForgotPassword = async (email: string) => {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Could not start password reset.');
    }

    return (data.message as string) || undefined;
  };

  const handleResetWithCode = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Reset failed');
    }
  };

  return (
    <>
      <AtmosTrackAuthCard
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={handleForgotPassword}
        onResetWithCode={handleResetWithCode}
      />
      <Toast />
    </>
  );
};

export default AuthPage;
