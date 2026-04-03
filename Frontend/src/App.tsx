import { useState, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import HealthAlerts from './components/HealthAlerts';
import DataExport from './components/DataExport';
import MapView from './components/MapView';
import Toast from './components/Toast';
import { ToastProvider } from './contexts/ToastContext';
import ImpactHub from './components/ImpactHub';
import AtmosTrackAuthCard from './components/AtmosTrackLogin';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import { RealtimeProvider } from './contexts/RealtimeContext';
import ErrorBoundary from './components/ErrorBoundary';
import RootRitual from './components/RootRitual';
import UserProfile from './components/UserProfile';
import RoleOnboardingModal from './components/RoleOnboardingModal';
import { API_BASE } from './config';
import { View, AuthUser, Role } from './types';

// Lazy load heavy admin components to break circular dependencies
const UserRoleCommandSurface = lazy(() => import('./pages/admin/UserRoleCommandSurface'));
const DataProvenance = lazy(() => import('./components/DataProvenance'));
const ExportRecipeCommandSurface = lazy(() => import('./pages/admin/ExportRecipeCommandSurface'));
// @ts-ignore
const CDRFleetDashboard = lazy(() => import('./components/CDRFleetDashboard'));

const AppViewSwitcher = ({ activeView, user, adminModeUnlocked, setActiveView, handleGrantAdminAccess }: {
  activeView: View;
  user: AuthUser | null;
  adminModeUnlocked: boolean;
  setActiveView: (v: View) => void;
  handleGrantAdminAccess: () => void;
}) => {
  switch (activeView) {
    case 'home':
      return <Home setActiveView={setActiveView} />;
    case 'dashboard':
      return <Dashboard setActiveView={setActiveView as (v: string) => void} />;
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
      return <ImpactHub />;
    case 'admin':
      if (user?.role === 'admin' || adminModeUnlocked) {
        return <AdminDashboard setActiveView={setActiveView} />;
      }
      return <NoAuthView />;
    case 'adminUsers':
      if (user?.role === 'admin' || adminModeUnlocked) {
        return <UserRoleCommandSurface />;
      }
      return <NoAuthView />;
    case 'rootRitual':
      return (
        <RootRitual
          setActiveView={setActiveView}
          onGrantAdminAccess={handleGrantAdminAccess}
        />
      );
    case 'profile':
      return <UserProfile onBack={() => setActiveView('dashboard')} />;
    case 'provenance':
      if (user?.role === 'admin' || adminModeUnlocked) {
        return <DataProvenance setActiveView={setActiveView} />;
      }
      return <NoAuthView section="Data Provenance" />;
    case 'exportRecipes':
      if (user?.role === 'admin' || adminModeUnlocked) {
        return <ExportRecipeCommandSurface setActiveView={setActiveView} />;
      }
      return <NoAuthView section="Export Recipes" />;
    case 'fleet':
      if (user?.role === 'viewer') {
        return <NoAuthView section="Fleet Console" />;
      }
      return <CDRFleetDashboard />;
    default:
      return <Home setActiveView={setActiveView} />;
  }
};

const NoAuthView = ({ section = 'This section' }: { section?: string }) => (
  <div className="pt-20 px-6">
    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Not authorized</h1>
    <p className="text-gray-600 text-sm">{section} is available for admin accounts only.</p>
  </div>
);

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
    if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
    const usr: AuthUser = {
      ...data.user,
      role: data.user.role.toLowerCase() as Role,
    };
    login(usr, data.token);
  };

  const handleSignup = async (name: string, email: string, password: string, role: 'viewer' | 'operator') => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Signup failed');
    const usr: AuthUser = {
      ...data.user,
      role: data.user.role.toLowerCase() as Role,
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
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data.message;
  };

  const handleResetWithCode = async (email: string, code: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
  };

  const renderView = () => (
    <Suspense fallback={
      <div className="pt-20 px-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
           <p className="text-sm text-gray-500 font-bold animate-pulse">Initializing Command Floor...</p>
        </div>
      </div>
    }>
      <AppViewSwitcher 
        activeView={activeView} 
        user={user} 
        adminModeUnlocked={adminModeUnlocked} 
        setActiveView={setActiveView} 
        handleGrantAdminAccess={handleGrantAdminAccess}
      />
    </Suspense>
  );

  // Root Ritual bypass
  if (!isAuthenticated && adminModeUnlocked) {
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

  if (!isAuthenticated) {
    if (activeView === 'rootRitual') {
      return (
        <>
          <RootRitual setActiveView={(v: string) => setActiveView(v as View)} onGrantAdminAccess={handleGrantAdminAccess} />
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
          setActiveView={(v: string) => setActiveView(v as View)}
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
      <RoleOnboardingModal />
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
