import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightCircle, Shield, Users, Server, Database, Settings } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="pt-20 px-4 pb-10 bg-gradient-to-br from-cream-50 to-orange-50 min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <Shield className="w-3 h-3" />
            AtmosTrack Admin Control Center
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">
            Welcome, {user?.name || 'Admin'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 max-w-xl">
            You have full control over AtmosTrack users, devices, data exports and carbon‑credit
            settings from one place.
          </p>
        </div>
        <div className="bg-white/80 border border-cream-200 rounded-2xl px-4 py-3 shadow-sm text-xs text-gray-600">
          <div className="font-semibold text-gray-800 mb-1">Current admin identity</div>
          <div>{user?.email}</div>
          <div className="mt-1 text-[11px] text-gray-500">
            Role: <span className="font-semibold uppercase">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Users */}
        <div className="space-y-4">
          <div className="bg-white/90 rounded-2xl border border-cream-200 p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    User & role overview
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Manage who can access AtmosTrack and what they see.
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-gray-600">
              <li>• View list of all users (planned)</li>
              <li>• Promote a user to operator/admin (planned)</li>
              <li>• Disable or lock suspicious accounts (planned)</li>
            </ul>

            <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-orange-600 hover:text-orange-700">
              Open user management
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/90 rounded-2xl border border-cream-200 p-5 shadow-md">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">
              Session & security
            </h2>
            <p className="text-[11px] text-gray-500 mb-3">
              High‑level security switches and upcoming controls.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Force logout all sessions (coming soon)</li>
              <li>• Require email verification for new users</li>
              <li>• Enforce strong password policy</li>
            </ul>
          </div>
        </div>

        {/* Column 2: Devices & data */}
        <div className="space-y-4">
          <div className="bg-white/90 rounded-2xl border border-cream-200 p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Device & node control
                </h2>
                <p className="text-[11px] text-gray-500">
                  Keep track of active AtmosTrack nodes on campus.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• View registered devices and last‑seen time (planned)</li>
              <li>• Mark devices as test / production (planned)</li>
              <li>• Configure sampling intervals & purification mode (planned)</li>
            </ul>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Open device management
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/90 rounded-2xl border border-cream-200 p-5 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                Data exports & research
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              Shortcuts to the existing Data Export tools.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Launch Data Export page with admin presets</li>
              <li>• Create & lock standard export recipes (planned)</li>
              <li>• Monitor export subscription usage (planned)</li>
            </ul>
          </div>
        </div>

        {/* Column 3: Credits & settings */}
        <div className="space-y-4">
          <div className="bg-white/90 rounded-2xl border border-cream-200 p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Carbon credit controls
                </h2>
                <p className="text-[11px] text-gray-500">
                  High‑level controls for DHI → CCT economics.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Adjust DHI → token conversion factor (planned)</li>
              <li>• Configure target network (Polygon / testnets) (planned)</li>
              <li>• View global CCT minted vs retired (planned)</li>
            </ul>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Open carbon credit console
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold mb-2">
              Quick links inside AtmosTrack
            </h2>
            <p className="text-[11px] text-slate-300 mb-3">
              Use the top navigation to jump between live Dashboard, Health Alerts, Map
              View, Data Export and Carbon Credits. This page will later host global
              admin‑only shortcuts and analytics.
            </p>
            <p className="text-[11px] text-slate-400">
              Tip: keep this tab open while you add real admin APIs so you can quickly
              plug actions into each section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
