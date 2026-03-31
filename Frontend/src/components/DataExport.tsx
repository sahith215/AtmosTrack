import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  MapPin,
  CheckCircle,
  Calendar,
  Filter,
  Sparkles,
  Clock,
  Database,
  Send,
  BarChart2,
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
  X,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import VerifyEmailModal from '../components/VerifyEmailModal';
import { API_BASE } from '../config';

interface PreviewRow {
  _id: string;
  timestamp: string;
  air?: { aqi?: number; co2ppm?: number };
  environment?: { temperature?: number; humidity?: number };
  location?: { lat?: number; lng?: number; context?: string };
  dataHash?: string;
  anchorStatus?: 'PENDING' | 'ANCHORED';
  txHash?: string | null;
}

const DataExport: React.FC = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetrics, setSelectedMetrics] = useState(['aqi', 'voc', 'co2', 'location']);
  const [isExporting, setIsExporting] = useState(false);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const { showToast } = useToast();
  const { token, user } = useAuth();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Blockchain integrity verify
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    readingId: string;
    deviceId: string;
    timestamp: string;
    intact: boolean;
    storedHash: string;
    recomputedHash: string;
    anchorStatus: string;
    txHash?: string | null;
    verdict: string;
  } | null>(null);

  const handleVerifyReading = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/sensor-data/${id}/verify`);
      const data = await res.json();
      if (data.ok) {
        setVerifyResult(data);
      } else {
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch {
      showToast('Network error during verification', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    if (user && token && user.emailVerified) {
      fetch(`${API_BASE}/api/exports/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.active) {
            setHasActiveSubscription(true);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user, token]);

  const requireVerified = () => {
    if (!user || !token) {
      showToast('Please log in to use data exports.', 'error');
      return false;
    }
    if (!user.emailVerified) {
      showToast('Please verify your email to use exports and daily automation.', 'error');
      setShowVerifyModal(true);
      return false;
    }
    return true;
  };

  const metrics = [
    { id: 'aqi', label: 'Air Quality Index', icon: BarChart2, color: 'text-orange-500' },
    { id: 'voc', label: 'VOC Levels', icon: Filter, color: 'text-purple-500' },
    { id: 'co2', label: 'CO₂ Concentration', icon: Database, color: 'text-emerald-500' },
    { id: 'location', label: 'Location Data', icon: MapPin, color: 'text-blue-500' },
  ];

  const dateOptions = [
    { value: '24hours', label: 'Last 24 Hours', icon: '🕐' },
    { value: '7days', label: 'Last 7 Days', icon: '📅' },
    { value: '30days', label: 'Last 30 Days', icon: '🗓️' },
    { value: '90days', label: 'Last 90 Days', icon: '📊' },
  ];

  const getRange = () => {
    const now = new Date();
    const to = now.toISOString();
    const fromDate = new Date(now);
    if (dateRange === '24hours') fromDate.setDate(fromDate.getDate() - 1);
    else if (dateRange === '7days') fromDate.setDate(fromDate.getDate() - 7);
    else if (dateRange === '30days') fromDate.setDate(fromDate.getDate() - 30);
    else if (dateRange === '90days') fromDate.setDate(fromDate.getDate() - 90);
    return { from: fromDate.toISOString(), to };
  };

  const selectedFields = () => {
    const base = ['timestamp', 'deviceId', 'location.lat', 'location.lng'];
    const extra: string[] = [];
    if (selectedMetrics.includes('aqi')) extra.push('air.aqi');
    if (selectedMetrics.includes('co2')) extra.push('air.co2ppm');
    if (selectedMetrics.includes('voc')) extra.push('aiFeatures.vocAvg');
    if (selectedMetrics.includes('location')) extra.push('location.context', 'location.lat', 'location.lng');
    return Array.from(new Set([...base, ...extra]));
  };

  const handleExport = async () => {
    if (!requireVerified()) return;
    try {
      setIsExporting(true);
      const { from, to } = getRange();
      const params = new URLSearchParams({ from, to, context: 'indoor' });

      // Step 1: Fetch the preview/count (JSON) with auth header
      const previewRes = await fetch(`${API_BASE}/api/exports/readings?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (previewRes.status === 403) {
        showToast('Email verification required before exporting.', 'error');
        setShowVerifyModal(true);
        setIsExporting(false);
        return;
      }

      if (!previewRes.ok) {
        let errBody: any = {};
        try { errBody = await previewRes.json(); } catch { /* ignore */ }
        showToast(errBody.error || 'Export failed', 'error');
        setIsExporting(false);
        return;
      }

      let data: any = {};
      try {
        data = await previewRes.json();
        setTotalMatches(data.totalMatches ?? 0);
        setPreviewRows(data.previewSample ?? []);
      } catch { /* ignore */ }

      // Step 2: Fetch the CSV with auth header → blob → programmatic download
      const csvRes = await fetch(`${API_BASE}/api/exports/readings/csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (csvRes.status === 403) {
        showToast('Email verification required before exporting.', 'error');
        setShowVerifyModal(true);
        setIsExporting(false);
        return;
      }

      if (!csvRes.ok) {
        showToast('CSV generation failed. Try again.', 'error');
        setIsExporting(false);
        return;
      }

      const blob = await csvRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atmostrack-readings-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${data?.totalMatches ?? 0} readings as CSV.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Network error while preparing export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };


  const handleCreateRecipe = async () => {
    if (!requireVerified()) return;
    if (!recipeName.trim()) { showToast('Please enter a recipe name.', 'error'); return; }
    if (!emailTo.trim()) { showToast('Please enter an email for daily reports.', 'error'); return; }

    try {
      const { from, to } = getRange();
      const body = {
        name: recipeName.trim(),
        questionText: '',
        deviceId: 'ATMOSTRACK-01',
        context: 'indoor',
        timeRange: { from, to },
        fields: selectedFields(),
        format: 'csv',
        language: 'python',
        delivery: { emailEnabled: true, emailTo: emailTo.trim(), driveEnabled: false, driveType: null, drivePath: null },
      };

      const res = await fetch(`${API_BASE}/api/exports/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        showToast('Email verification required before creating export recipes.', 'error');
        setShowVerifyModal(true);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.ok) { showToast(data.error || 'Failed to create recipe.', 'error'); return; }
      setRunUrl(data.runUrl);
      showToast('Export recipe created. Daily automation will use this recipe.', 'success');

      try {
        const subRes = await fetch(`${API_BASE}/api/exports/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: emailTo.trim(),
            exports: { co2Digest: true, emissionsLedger: false, sourceDebug: false },
            runUrl: data.runUrl,
          }),
        });
        if (subRes.status === 403) {
          showToast('Email verification required before enabling daily automation emails.', 'error');
          setShowVerifyModal(true);
        } else if (subRes.ok) {
          setHasActiveSubscription(true);
        }
      } catch (e) { console.error(e); }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating recipe.', 'error');
    }
  };

  const handleCancelAutomation = async () => {
    if (!requireVerified()) return;
    try {
      setIsExporting(true);
      const res = await fetch(`${API_BASE}/api/exports/subscription`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHasActiveSubscription(false);
        showToast('Daily automation cancelled successfully.', 'success');
      } else {
        showToast('Failed to cancel automation.', 'error');
      }
    } catch (e) {
      showToast('Network error while cancelling.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]
    );
  };

  return (
    <>
      <VerifyEmailModal
        open={showVerifyModal}
        onClose={() => { setShowVerifyModal(false); setIsExporting(false); }}
      />

      <div className="pt-16 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/60 to-amber-50 animate-fade-in">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Researcher-Grade Data Access
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Data{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Export Center
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Download sensor readings or schedule automated CSV reports delivered to your inbox.
            </p>
          </div>
        </div>

        {/* ── TWO-COLUMN GRID ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-6">

            {/* Date Range */}
            <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60 ring-1 ring-orange-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-md">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Date Range</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {dateOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`
                      relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 group
                      ${dateRange === opt.value
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-100'
                        : 'border-gray-100 bg-white/60 hover:border-orange-200 hover:bg-orange-50/50'
                      }
                    `}
                  >
                    <span className="text-lg mb-1 block">{opt.icon}</span>
                    <span className={`text-sm font-semibold block ${dateRange === opt.value ? 'text-orange-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    {dateRange === opt.value && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 shadow-sm shadow-orange-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Metrics */}
            <div className="flex-1 bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60 ring-1 ring-orange-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-md">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Data Metrics</h3>
              </div>
              <div className="space-y-3">
                {metrics.map(metric => {
                  const Icon = metric.icon;
                  const checked = selectedMetrics.includes(metric.id);
                  return (
                    <label
                      key={metric.id}
                      className={`
                        flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2
                        ${checked
                          ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                          : 'border-transparent bg-gray-50/70 hover:bg-orange-50/50 hover:border-orange-100'
                        }
                      `}
                    >
                      <div className={`relative w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                        {checked && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMetric(metric.id)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <Icon className={`w-6 h-6 flex-shrink-0 ${metric.color}`} />
                      <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${checked ? 'text-gray-900' : 'text-gray-600'}`}>
                          {metric.label}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">
                          {metric.id === 'aqi' && 'Composite air quality score (0–500)'}
                          {metric.id === 'voc' && 'Volatile organic compound average'}
                          {metric.id === 'co2' && 'Carbon dioxide concentration in ppm'}
                          {metric.id === 'location' && 'GPS coordinates + context label'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="flex flex-col gap-6">

            {/* Download CSV */}
            <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60 ring-1 ring-orange-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-md">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Instant Export</h3>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`
                  w-full relative overflow-hidden py-4 rounded-2xl font-bold text-white text-sm
                  bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500
                  shadow-lg shadow-orange-200 transition-all duration-300
                  ${isExporting ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.99]'}
                `}
              >
                <span className="relative flex items-center justify-center gap-2.5">
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Preparing CSV…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download CSV
                    </>
                  )}
                </span>
              </button>

              {totalMatches !== null && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-sm text-emerald-700 font-medium">
                    {totalMatches} readings matched — preview below
                  </p>
                </div>
              )}
            </div>

            {/* Automation Recipe */}
            <div className="flex-1 flex flex-col bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60 ring-1 ring-orange-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Daily Automation</h3>
                  <p className="text-xs text-gray-400">Scheduled CSV reports via email</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Recipe name
                  </label>
                  <input
                    value={recipeName}
                    onChange={e => setRecipeName(e.target.value)}
                    placeholder="e.g. Daily Indoor CO₂ Digest"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50/70 text-sm text-gray-800 placeholder-gray-400
                      focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-3 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Delivery email
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50/70 text-sm text-gray-800 placeholder-gray-400
                      focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-3 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                {hasActiveSubscription ? (
                  <button
                    onClick={handleCancelAutomation}
                    disabled={isExporting}
                    className={`
                      w-full py-3.5 rounded-2xl font-bold text-sm text-white
                      bg-gradient-to-r from-red-500 via-red-500 to-rose-600
                      shadow-lg shadow-red-200 transition-all duration-300
                      ${isExporting ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.99]'}
                      flex items-center justify-center gap-2.5
                    `}
                  >
                    Cancel Daily Automation
                  </button>
                ) : (
                  <button
                    onClick={handleCreateRecipe}
                    disabled={isExporting}
                    className={`
                      w-full py-3.5 rounded-2xl font-bold text-sm text-white
                      bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600
                      shadow-lg shadow-indigo-200 transition-all duration-300
                      ${isExporting ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.99]'}
                      flex items-center justify-center gap-2.5
                    `}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Start Daily Automation
                  </button>
                )}

                {runUrl && (
                  <div className="mt-1 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-1">Automation endpoint</p>
                    <p className="text-[11px] text-indigo-700 font-mono break-all leading-relaxed">{runUrl}</p>
                  </div>
                )}
              </div>

              {/* ── How it works — fills the empty space ── */}
              <div className="mt-auto pt-5">
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">How it works</p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">1</div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-semibold text-gray-700">Save a recipe</span> — your selected date range, metrics, and delivery email are stored as a reusable export template.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">2</div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-semibold text-gray-700">AtmosTrack runs it nightly</span> — the backend scheduler fires the recipe every 24 hours and generates a fresh CSV from the latest sensor data.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">3</div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-semibold text-gray-700">CSV lands in your inbox</span> — delivered as an email attachment with a summary of record count and time range covered.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-medium">AQI</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">VOC</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">CO₂</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">Location</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 font-medium">Timestamp</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">🔒 Hash</span>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2">Fields included in every automated CSV delivery</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FULL-WIDTH DATA PREVIEW ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-gray-700 to-gray-900">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-800">Data Preview</h3>
                <p className="text-sm text-gray-500">
                  {totalMatches === null
                    ? 'Run an export to see matching readings'
                    : `${totalMatches} total readings matched · showing latest ${previewRows.length}`}
                </p>
              </div>
            </div>

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Timestamp', 'AQI', 'CO₂ (ppm)', 'Temp °C', 'Humidity %'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">{h}</th>
                      ))}
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">🔒 Integrity</th>
                      <th className="py-2.5 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={row._id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                          {new Date(row.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{row.air?.aqi ?? '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.air?.co2ppm ?? '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.environment?.temperature ?? '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.environment?.humidity ?? '—'}</td>
                        <td className="py-2.5 px-3">
                          {row.dataHash ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                {row.anchorStatus === 'ANCHORED' ? (
                                  <>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">⛓️ Anchored</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Hashed</span>
                                  </>
                                )}
                              </div>
                              <span
                                title={row.dataHash}
                                className="font-mono text-[9px] text-gray-400 leading-tight cursor-help"
                              >
                                {row.dataHash!.slice(0, 8)}…{row.dataHash!.slice(-4)}
                              </span>
                              {row.anchorStatus === 'ANCHORED' && row.txHash && (
                                <a
                                  href={`https://amoy.polygonscan.com/tx/${row.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-indigo-500 hover:text-indigo-700 underline underline-offset-2 truncate max-w-[80px]"
                                  title={row.txHash}
                                >
                                  View on PolygonScan ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <span className="text-[10px] text-gray-300">No hash</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {row.dataHash && (
                            <button
                              onClick={() => handleVerifyReading(row._id)}
                              disabled={verifyingId === row._id}
                              title="Re-hash and verify this reading"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold
                                bg-indigo-50 text-indigo-600 border border-indigo-100
                                hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-150
                                disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {verifyingId === row._id ? (
                                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ScanSearch className="w-3 h-3" />
                              )}
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No data preview yet</p>
                <p className="text-xs text-gray-400 mt-1.5 max-w-xs">Press <span className="font-semibold text-orange-500">Download CSV</span> above to fetch and preview your matched sensor readings here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification result modal */}
      {verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
            <button
              onClick={() => setVerifyResult(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${verifyResult.intact ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-red-400 to-rose-500'
                }`}>
                {verifyResult.intact
                  ? <ShieldCheck className="w-5 h-5 text-white" />
                  : <ShieldAlert className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Integrity Verification</h3>
                <p className="text-xs text-gray-400">{verifyResult.deviceId} &nbsp;·&nbsp; {new Date(verifyResult.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className={`mb-5 px-4 py-3 rounded-2xl text-sm font-semibold ${verifyResult.intact ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              {verifyResult.verdict}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hash comparison — how it verified</p>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">① Stored at ingest (original fingerprint)</p>
                  <p className="font-mono text-[11px] text-indigo-700 break-all bg-indigo-50 rounded-xl px-3 py-2 leading-relaxed">
                    {verifyResult.storedHash}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400">backend re-ran SHA-256 on current DB data</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">② Re-computed just now</p>
                  <p className={`font-mono text-[11px] break-all rounded-xl px-3 py-2 leading-relaxed ${verifyResult.intact ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                    }`}>
                    {verifyResult.recomputedHash}
                  </p>
                </div>
              </div>

              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${verifyResult.intact ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                <span>Hashes match?</span>
                <span>{verifyResult.intact ? '✅ YES — data is intact' : '🚨 NO — data was altered!'}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 text-xs">
                <span className="text-gray-500">Anchor status</span>
                {verifyResult.anchorStatus === 'ANCHORED' && verifyResult.txHash ? (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${verifyResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 flex items-center gap-1"
                  >
                    ⛓️ View on PolygonScan ↗
                  </a>
                ) : (
                  <span className={`font-semibold ${verifyResult.anchorStatus === 'ANCHORED' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                    {verifyResult.anchorStatus === 'ANCHORED' ? '⛓️ On-chain anchored' : '⏳ PENDING — anchoring in progress'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataExport;
