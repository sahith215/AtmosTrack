import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'; // adjust if Navbar is in a subfolder

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Role-based navigation — viewers have read-only access (no export)
  const baseViewerItems = [
    { id: 'home',      label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'map',       label: 'Map View' },
    { id: 'health',    label: 'Health Alerts' },
    { id: 'carbon',    label: 'Carbon Hub' },
  ];

  const navItems: { id: string; label: string }[] = (() => {
    const role = user?.role ?? 'viewer';
    if (role === 'admin') {
      return [
        ...baseViewerItems,
        { id: 'export', label: 'Data Export' },
        { id: 'admin',  label: 'Admin' },
      ];
    }
    if (role === 'operator') {
      return [
        ...baseViewerItems,
        { id: 'export', label: 'Data Export' },
      ];
    }
    // viewer — no export, no admin
    return baseViewerItems;
  })();

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setActiveView('home');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
  className="flex items-center space-x-3 cursor-pointer"
  onClick={() => handleNavClick('home')}
>
  <div
    className="
      w-10 h-10
      rounded-xl                      /* less round than 2xl */
      border-2 border-orange-400      /* thick orange border */
      overflow-hidden
      bg-white                        /* neutral inside so logo colors show */
      shadow-lg
      transform hover:scale-105
      transition-all duration-200
    "
  >
    <img
      src={logo}
      alt="AtmosTrack logo"
      className="w-full h-full object-cover"
    />
  </div>
  <span className="text-2xl font-bold text-gray-800">AtmosTrack</span>
</div>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105
                  ${
                    activeView === item.id
                      ? 'bg-orange-100 text-orange-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-cream-100'
                  }
                `}
              >
                {item.label}
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-cream-100 transition-all"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <span className="text-[11px] text-gray-500">
                {user.role === 'admin' ? 'ADMIN' : 'USER'}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-cream-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cream-200 bg-white/95 backdrop-blur-md animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    block w-full text-left px-3 py-2 rounded-lg font-medium transition-all duration-200
                    ${
                      activeView === item.id
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-cream-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-cream-100"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
