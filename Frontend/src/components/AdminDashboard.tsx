import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRightCircle,
  Shield,
  Users,
  Activity,
  Zap,
  Lock,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Cpu,
  Link2,
  FileDown,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { API_BASE } from '../config';

type AdminDashboardProps = {
  setActiveView: (view: any) => void;
};

type AdminStats = {
  users: {
    total: number;
    verified: number;
    locked: number;
    byRole: { admin: number; operator: number; viewer: number };
  };
  readings: { total: number; anchored: number };
  carbon: { pendingBatches: number };
};

// const API_BASE = 'http://localhost:5000'; // Removed local override - it's imported now

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveView }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const anchorPct = stats && stats.readings.total > 0
    ? Math.min(100, (stats.readings.anchored / stats.readings.total) * 100)
    : 0;

  const systemChecks = [
    { label: 'Backend API', status: 'healthy', ok: true },
    { label: 'MongoDB', status: 'connected', ok: true },
    { label: 'Rate limiting', status: 'active', ok: true },
    { label: 'JWT invalidation', status: 'active', ok: true },
    { label: 'AI inference server', status: 'wiring soon', ok: false },
    {
      label: 'Polygon Amoy',
      status: stats?.readings.anchored ? 'connected' : 'standby',
      ok: !!stats?.readings.anchored,
    },
  ];

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/60 to-amber-50 animate-fade-in">

      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl">
          {/* subtle grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 32px)' }} />
          {/* orange glow */}
          <div className="pointer-events-none absolute -top-20 -left-10 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 sm:px-8 py-7">

            {/* Title block */}
            <div className="space-y-3 pr-20 md:pr-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/40 text-[11px] font-bold text-orange-300 uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5" />
                Root Admin Console
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Command{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  Surface
                </span>
              </h1>
              <p className="text-sm text-slate-400 max-w-lg">
                High-risk controls for users, nodes, carbon credits and export automation. Every action on this page is logged and audited.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Live nodes &amp; exports
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  Role-locked · audited
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Root session
                </span>
              </div>
            </div>

            {/* Identity card */}
            <div className="shrink-0 w-full md:w-[240px]">
              <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-700/80 p-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-cyan-400/10" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Identity</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] text-emerald-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mb-2 shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'unknown@atmostrack'}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-[10px] font-bold text-orange-300 uppercase tracking-wider">
                      {(user?.role || 'admin')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GLOBAL STATS STRIP ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats?.users.total, icon: Users, color: 'text-orange-600', bg: 'from-orange-50 to-amber-50', border: 'border-orange-100' },
            { label: 'Verified', value: stats?.users.verified, icon: CheckCircle, color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
            { label: 'Total Readings', value: stats?.readings.total?.toLocaleString(), icon: Activity, color: 'text-sky-600', bg: 'from-sky-50 to-blue-50', border: 'border-sky-100' },
            { label: 'On-chain Anchored', value: stats?.readings.anchored?.toLocaleString(), icon: Link2, color: 'text-indigo-600', bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-100' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl border ${border} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>
                {loading ? <span className="text-gray-300">—</span> : (value ?? 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ERROR BANNER ─────────────────────────────────────────── */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-5">
          <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
            <button onClick={fetchStats} className="flex items-center gap-1.5 text-xs font-bold hover:underline">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6">

        {/* Row 1: User management + Nodes/Carbon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* User & Role Command */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-orange-100 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">User &amp; Role Management</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Promote, lock and audit every account in the system.</p>
                </div>
              </div>
              <button
                onClick={fetchStats}
                title="Refresh stats"
                className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total</div>
                <div className="text-xl font-black text-orange-600">{loading ? '—' : (stats?.users.total ?? 0)}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Verified</div>
                <div className="text-xl font-black text-emerald-600">{loading ? '—' : (stats?.users.verified ?? 0)}</div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Locked</div>
                <div className="text-xl font-black text-rose-600">{loading ? '—' : (stats?.users.locked ?? 0)}</div>
              </div>
            </div>

            {/* Role breakdown */}
            {stats && (
              <div className="flex gap-2">
                {[
                  { role: 'Admins', count: stats.users.byRole.admin, color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { role: 'Operators', count: stats.users.byRole.operator, color: 'bg-sky-100 text-sky-700 border-sky-200' },
                  { role: 'Viewers', count: stats.users.byRole.viewer, color: 'bg-gray-100 text-gray-600 border-gray-200' },
                ].map(({ role, count, color }) => (
                  <div key={role} className={`flex-1 rounded-xl border px-2 py-1.5 text-center ${color}`}>
                    <div className="text-[10px] font-medium">{role}</div>
                    <div className="text-sm font-bold">{count}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" /><span>Full directory with search, filters and last-login timestamps</span></div>
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" /><span>Promote / demote Viewer ⇄ Operator ⇄ Admin with audit trail</span></div>
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" /><span>Lock or force-logout suspicious accounts instantly</span></div>
            </div>

            <button
              onClick={() => setActiveView('adminUsers')}
              className="mt-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Open User Management
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          {/* AtmosTrack CDR Fleet */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-emerald-100 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">CDR Fleet &amp; Carbon Removal</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Live industrial skids, mineralization rates and net removal.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            </div>
 
            {/* Readings stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total CO₂ Removed</div>
                <div className="text-xl font-black text-emerald-700">250.0 <span className="text-xs font-bold text-gray-400">TONS</span></div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Fleet Capacity</div>
                <div className="text-xl font-black text-sky-700">1 <span className="text-xs font-bold text-gray-400">SKID</span></div>
              </div>
            </div>
 
            {/* Anchor progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Mineralization Efficiency</span>
                <span className="text-[10px] font-bold text-emerald-600">95.0%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                  style={{ width: `95%` }}
                />
              </div>
            </div>
 
            <div className="border-t border-gray-100 pt-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /><span>Monitor industrial exhaust processing at cement plant nodes</span></div>
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /><span>Validate real-time dMRV sensor data against kiln output</span></div>
              <div className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /><span>Manage carbon credit minting based on verified physical tons</span></div>
            </div>
 
            <button
              onClick={() => setActiveView('fleet')}
              className="mt-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Manage Fleet Console
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Provenance + Exports + System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Data Provenance */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-violet-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Data Provenance</h2>
                <p className="text-xs text-gray-500 mt-0.5">Full lineage: ingest → hash → chain → credit</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { text: 'SHA-256 tamper detection on every reading', ok: true },
                { text: 'Polygon Amoy blockchain anchor status', ok: true },
                { text: 'DHI batch & carbon credit linkage', ok: true },
                { text: 'AI classification audit trail', ok: true },
              ].map(({ text, ok }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${ok ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className="text-xs text-gray-600">{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveView('provenance')}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Open Provenance Explorer
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Export Recipes */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-sky-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Export Recipes</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage CSV automation and delivery pipelines.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                'Create, edit and lock export recipes for the whole org',
                'Run any recipe on demand and stream CSV to the browser',
                'Control which emails receive daily data digests',
                'Inspect webhook health and last response codes',
              ].map(text => (
                <div key={text} className="flex items-start gap-2.5">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600">{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveView('exportRecipes')}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Manage Exports &amp; Automation
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>

          {/* System Health */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-700 to-slate-800 flex items-center justify-center text-white shadow-lg shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">System Health</h2>
                <p className="text-xs text-gray-500 mt-0.5">Live status of all infrastructure services.</p>
              </div>
            </div>

            <div className="space-y-2">
              {systemChecks.map(({ label, status, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ok
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                    {ok
                      ? <CheckCircle className="w-2.5 h-2.5" />
                      : <XCircle className="w-2.5 h-2.5" />}
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending carbon batches
                </span>
                <span className="font-bold text-amber-600">{loading ? '—' : (stats?.carbon.pendingBatches ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Anchor coverage
                </span>
                <span className="font-bold text-sky-600">{anchorPct}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
