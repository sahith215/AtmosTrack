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

function App() {
  const [activeView, setActiveView] = useState<'home' | 'dashboard' | 'map' | 'health' | 'export' | 'carbon'>('home');

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
      default:
        return <Home setActiveView={setActiveView} />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-cream-50">
        <Navbar activeView={activeView} setActiveView={setActiveView} />
        <main className="transition-all duration-500 ease-in-out">
          {renderView()}
        </main>
        <Toast />
      </div>
    </ToastProvider>
  );
}

export default App;
