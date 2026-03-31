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
import ErrorBoundary from './components/ErrorBoundary';
import RootRitual from './components/RootRitual';
import UserRoleCommandSurface from './pages/admin/UserRoleCommandSurface';
import UserProfile from './components/UserProfile';
import DataProvenance from './components/DataProvenance';
import { API_BASE } from './config';

export type View =
  | 'home'
  | 'dashboard'
  | 'map'
  | 'health'
  | 'export'
  | 'carbon'
  | 'admin'
  | 'rootRitual'
  | 'adminUsers'
  | 'profile'
  | 'provenance';

// const API_BASE = 'http://localhost:5000'; // Removed local override

function AppInner() {
  const [activeView, setActiveView] = useState<View>('home');
  const { isAuthenticated, login, user, setAdminModeUnlocked, adminModeUnlocked } = useAuth();

  const handleGrantAdminAccess = () => {
    setAdminModeUnlocked(true);
    localStorage.setItem('atmos_admin_mode', 'true');
    setActiveView('admin');
  };

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
      role: data.user.role.toLowerCase(),
      emailVerified: data.user.emailVerified,
      lastLogin: data.user.lastLogin ?? null,
    };

    login(usr, data.token);
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string,
    role: 'viewer' | 'operator',
  ) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(
        data.error || 'Could not create account. Try another email.',
      );
    }

    const usr: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role.toLowerCase(),
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
        return <Home setActiveView={(v: string) => setActiveView(v as View)} />;

      case 'dashboard':
        return <Dashboard setActiveView={(v) => setActiveView(v as any)} />;
      case 'map':
        return <MapView />;
      case 'health':
        return <HealthAlerts />;
      case 'export':
        if (user?.role === 'viewer') {
          return (
            <div className="pt-24 min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 to-orange-50 px-6">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-orange-100 p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center mx-auto shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Data Export is available for <span className="font-semibold text-orange-600">Operator</span> and <span className="font-semibold text-orange-600">Admin</span> accounts only.
                  Your current role is <span className="font-semibold capitalize">{user?.role}</span>.
                </p>
                <p className="text-xs text-gray-400">
                  Contact your AtmosTrack administrator to request an upgraded role.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md hover:scale-[1.02] transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          );
        }
        return <DataExport />;
      case 'carbon':
        return <CarbonDashboard />;
      case 'admin':
        if (user?.role === 'admin') {
          return <AdminDashboard setActiveView={(v: string) => setActiveView(v as View)} />;
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
      case 'adminUsers':
        if (user?.role === 'admin') {
          return <UserRoleCommandSurface />;
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
      case 'rootRitual':
        return (
          <RootRitual
            setActiveView={(v: string) => setActiveView(v as View)}
            onGrantAdminAccess={handleGrantAdminAccess}
          />
        );
      case 'profile':
        return <UserProfile onBack={() => setActiveView('dashboard')} />;
      case 'provenance':
        if (user?.role === 'admin') {
          return <DataProvenance setActiveView={(v: string) => setActiveView(v as View)} />;
        }
        return (
          <div className="pt-20 px-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Not authorized</h1>
            <p className="text-gray-600 text-sm">Data Provenance Explorer is available for admin accounts only.</p>
          </div>
        );
      default:
        return <Home setActiveView={(v: string) => setActiveView(v as View)} />;
    }
  };


  // Root Ritual bypass: grant admin access even when not authenticated
  if (!isAuthenticated && adminModeUnlocked) {
    return (
      <div className="min-h-screen bg-cream-50">
        <AdminDashboard setActiveView={setActiveView} />
        <Toast />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (activeView === 'rootRitual') {
      return (
        <>
          <RootRitual
            setActiveView={setActiveView}
            onGrantAdminAccess={handleGrantAdminAccess}
          />
          <Toast />
        </>
      );
    }

    return (
      <>
        <AtmosTrackAuthCard
          onLogin={handleLogin}
          onSignup={handleSignup}
          onForgotPassword={handleForgotPassword}
          onResetWithCode={handleResetWithCode}
          setActiveView={setActiveView}
        />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar activeView={activeView} setActiveView={(v: string) => setActiveView(v as View)} />
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
        <ErrorBoundary>
          <RealtimeProvider>
            <AppInner />
          </RealtimeProvider>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
