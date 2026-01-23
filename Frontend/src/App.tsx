import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import HealthAlerts from './components/HealthAlerts';
import DataExport from './components/DataExport';
import MapView from './components/MapView';
import Toast from './components/Toast';
import { ToastProvider } from './contexts/ToastContext';
import CarbonDashboard from './components/CarbonDashboard';
import AtmosTrackAuthCard from './components/AtmosTrackLogin';
import { AuthProvider, useAuth, AuthUser } from './contexts/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import { RealtimeProvider } from './contexts/RealtimeContext';

type View = 'home' | 'dashboard' | 'map' | 'health' | 'export' | 'carbon' | 'admin';

const API_BASE = 'http://localhost:5000';

function AppInner() {
  const [activeView, setActiveView] = useState<View>('home');
  const { isAuthenticated, login, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.status === 404 || data.error === 'USER_NOT_FOUND') {
      throw new Error('No AtmosTrack account for this email. Create one first.');
    }

    if (res.status === 401 || data.error === 'WRONG_PASSWORD') {
      throw new Error('Incorrect password for this AtmosTrack account.');
    }

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Login failed. Please try again.');
    }

    const usr: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      emailVerified: data.user.emailVerified,
      lastLogin: data.user.lastLogin ?? null,
    };

    login(usr, data.token);
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Could not create account. Try another email.');
    }

    const usr: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      emailVerified: data.user.emailVerified,
      lastLogin: data.user.lastLogin ?? null,
    };

    login(usr, data.token);
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

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home setActiveView={setActiveView} />;
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <MapView />;
      case 'health':
        return <HealthAlerts />;
      case 'export':
        return <DataExport />;
      case 'carbon':
        return <CarbonDashboard />;
      case 'admin':
        if (user?.role === 'admin') {
          return <AdminDashboard />;
        }
        return (
          <div className="pt-20 px-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Not authorized
            </h1>
            <p className="text-gray-600 text-sm">
              This section is only available for AtmosTrack admin accounts.
            </p>
          </div>
        );
      default:
        return <Home setActiveView={setActiveView} />;
    }
  };

  if (!isAuthenticated) {
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
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar activeView={activeView} setActiveView={setActiveView} />
      <main className="transition-all duration-500 ease-in-out">
        {renderView()}
      </main>
      <Toast />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RealtimeProvider>
          <AppInner />
        </RealtimeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
