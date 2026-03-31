import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wind,
  MapPin,
  Clock,
  Shield,
  Wifi,
  WifiOff,
  Thermometer,
  Gauge,
  Navigation,
  Zap,
} from 'lucide-react';
import CountUp from './CountUp';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import VerifyEmailModal from './VerifyEmailModal';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SensorData {
  deviceId: string;
  environment: {
    temperature: number | null;
    humidity: number | null;
  };
  imu: {
    ax: number | null;
    ay: number | null;
    az: number | null;
    gx: number | null;
    gy: number | null;
    gz: number | null;
  };
  location: {
    lat: number | null;
    lng: number | null;
    speed: number | null;
  };
  purification: {
    on: boolean;
  };
  co2: {
    ppm: number;
    status: string;
    healthAdvice: string;
  } | null;
  mq135: {
    raw: number | null;
    volt: number | null;
  };
  timestamp: string;
}


import { API_BASE } from '../config';

type HistoryPoint = { ts: number; co2: number | null; aqi: number | null; temp: number | null };

const Dashboard: React.FC<{ setActiveView?: (v: string) => void }> = ({ setActiveView }) => {
  const { user, token } = useAuth();
  const { latestReading, status } = useRealtime();

  // Map LiveReading → SensorData so the rest of the component stays unchanged
  const liveData: SensorData | null = latestReading
    ? {
      deviceId: latestReading.deviceId,
      environment: {
        temperature: latestReading.environment?.temperature ?? null,
        humidity: latestReading.environment?.humidity ?? null,
      },
      // rest stays exactly as you pasted
      imu: {
        ax: latestReading.imu?.ax ?? null,
        ay: latestReading.imu?.ay ?? null,
        az: latestReading.imu?.az ?? null,
        gx: latestReading.imu?.gx ?? null,
        gy: latestReading.imu?.gy ?? null,
        gz: latestReading.imu?.gz ?? null,
      },
      location: {
        lat: latestReading.location?.lat ?? null,
        lng: latestReading.location?.lng ?? null,
        speed: latestReading.location?.speed ?? null,
      },
      purification: {
        on: latestReading.purification?.on ?? false,
      },
      co2: latestReading.co2
        ? {
          ppm: latestReading.co2.ppm,
          status: latestReading.co2.status,
          healthAdvice: latestReading.co2.healthAdvice,
        }
        : null,
      mq135: {
        raw: latestReading.mq135?.raw ?? null,
        volt: latestReading.mq135?.volt ?? null,
      },
      timestamp: latestReading.timestamp,
    }
    : null;

  const [aqiValue, setAqiValue] = useState(0);
  const [co2Value, setCo2Value] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [latestPhoneLocation, setLatestPhoneLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Email verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [hideVerifyBanner, setHideVerifyBanner] = useState(false);

  // 24-hour history chart
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [historyHours, setHistoryHours] = useState(24);
  const [historyLoading, setHistoryLoading] = useState(false);

  const convertRawToAQI = (rawValue: number): number => {
    const aqi = Math.floor((rawValue / 4095) * 500);
    return Math.max(0, Math.min(500, aqi));
  };

  const getMQ135Status = (raw: number): string => {
    if (raw <= 800) return 'Excellent';
    if (raw <= 1500) return 'Good';
    if (raw <= 2500) return 'Moderate';
    return 'Poor';
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  // Fetch historical readings for the chart
  useEffect(() => {
    if (!token) return;
    setHistoryLoading(true);
    fetch(`${API_BASE}/api/readings/history?hours=${historyHours}&deviceId=ATMOSTRACK-01`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) setHistoryData(d.data);
      })
      .catch(() => { })
      .finally(() => setHistoryLoading(false));
  }, [historyHours, token]);

  // Drive online status from shared connection status
  useEffect(() => {
    setIsOnline(status === 'connected');
  }, [status]);

  // Auto-request browser geolocation on mount (no button needed).
  // First load: browser prompts for permission once.
  // Subsequent loads: uses cached localStorage coords immediately,
  // then re-fetches fresh coords in the background.
  useEffect(() => {
    const pushLocation = (lat: number, lng: number, deviceId: string) => {
      setLatestPhoneLocation({ lat, lng });
      localStorage.setItem(
        'atmostrack-phone-location',
        JSON.stringify({ lat, lng, deviceId }),
      );
      fetch(`${API_BASE}/api/nodes/set-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => { });
    };

    const deviceId = 'ATMOSTRACK-01';

    // Immediately restore cached location so the UI isn't empty
    const saved = localStorage.getItem('atmostrack-phone-location');
    if (saved) {
      try {
        const { lat, lng } = JSON.parse(saved);
        pushLocation(lat, lng, deviceId);
      } catch { /* ignore corrupt cache */ }
    }

    // Then get a fresh GPS fix in the background
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude, deviceId),
        (err) => console.warn('Geolocation unavailable:', err.message),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    }
  }, []);

  // Derived values from liveData
  // Treat co2 as absent when status is UNKNOWN (stale/test data)
  const validCo2 = liveData?.co2?.status && liveData.co2.status !== 'UNKNOWN' ? liveData.co2 : null;
  const aqi = liveData?.mq135?.raw ? convertRawToAQI(liveData.mq135.raw) : 0;
  const co2Ppm = validCo2?.ppm ?? 0;
  const lastUpdated = liveData ? getTimeAgo(liveData.timestamp) : 'No data';
  const healthAdvice =
    validCo2?.healthAdvice ?? 'Waiting for live sensor data...';

  // Animate AQI and CO2
  useEffect(() => {
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setAqiValue(aqi);
      setCo2Value(co2Ppm);
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [aqi, co2Ppm, liveData]);

  // Helper functions
  const getAQIColor = (value: number) => {
    if (value <= 50) return 'text-green-600';
    if (value <= 100) return 'text-orange-600';
    if (value <= 150) return 'text-red-600';
    return 'text-purple-600';
  };

  const getAQIBg = (value: number) => {
    if (value <= 50) return 'bg-green-100';
    if (value <= 100) return 'bg-orange-100';
    if (value <= 150) return 'bg-red-100';
    return 'bg-purple-100';
  };

  const getAQILabel = (value: number) => {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    return 'Unhealthy';
  };

  const getCO2Color = (value: number) => {
    if (value <= 500) return 'text-green-600';
    if (value <= 700) return 'text-blue-600';
    if (value <= 1000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCO2Label = (value: number) => {
    if (value <= 500) return 'Excellent';
    if (value <= 700) return 'Good';
    if (value <= 1000) return 'Moderate';
    return 'Poor';
  };



  // Use liveData.deviceId as selected node
  const selectedDeviceId = liveData?.deviceId ?? null;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/40 to-amber-50 animate-fade-in">

      {/* ── PAGE WRAPPER ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── ROW 1: PAGE HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              AtmosTrack{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Live Dashboard
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time multi-sensor monitoring · {selectedDeviceId ?? 'ATMOSTRACK-01'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? 'Live · ESP32 Connected' : 'Offline'}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-cream-200 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" /> Updated {lastUpdated}
            </div>
          </div>
        </div>

        {/* ── Email Verification Banner ───────────────────────────────── */}
        {!hideVerifyBanner && user && user.emailVerified === false && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-5 py-3 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Verify your email to unlock exports &amp; Carbon Hub</p>
              <p className="text-xs opacity-90 mt-0.5">We use verification to protect your AtmosTrack credits and data.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowVerifyModal(true)} className="px-4 py-1.5 rounded-xl bg-white text-orange-600 text-xs font-bold hover:bg-orange-50 transition">
                Verify now
              </button>
              <button onClick={() => setHideVerifyBanner(true)} className="text-[11px] opacity-80 hover:opacity-100">
                Later
              </button>
            </div>
          </div>
        )}

        {/* ── ROW 2: ACCOUNT + STATION STRIP ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Account card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">Account Connected</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{user?.name || 'AtmosTrack User'}</p>
              <p className="text-slate-400 text-xs mt-0.5">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-700/80 border border-slate-600 text-slate-200 text-[11px] font-medium capitalize">
                {user?.role}
              </span>
              <span className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                user?.emailVerified
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500 text-amber-300'
              }`}>
                {user?.emailVerified ? '✓ Verified' : '⚠ Unverified'}
              </span>
            </div>
            <button
              onClick={() => setActiveView?.('profile')}
              className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow hover:shadow-md transition"
            >
              Manage Profile
            </button>
          </div>

          {/* Station card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-cream-200 shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">Current Station</p>
                <p className="text-xs text-gray-500">AtmosTrack Mobile Sensor Node</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-gray-500 mb-1">Latitude</p>
                <p className="font-bold text-orange-700 font-mono">
                  {liveData?.location?.lat != null ? liveData.location.lat.toFixed(5) : '0.00000'}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-gray-500 mb-1">Longitude</p>
                <p className="font-bold text-orange-700 font-mono">
                  {liveData?.location?.lng != null ? liveData.location.lng.toFixed(5) : '0.00000'}
                </p>
              </div>
            </div>
            {latestPhoneLocation && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                <span>📍 Phone GPS:</span>
                <span className="font-mono">{latestPhoneLocation.lat.toFixed(5)}, {latestPhoneLocation.lng.toFixed(5)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: HERO SENSOR CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

          {/* DHT11 */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-2xl p-6 border border-blue-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow">
                <Thermometer className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">DHT11 Sensor</p>
                <p className="text-[11px] text-gray-500">Temp &amp; Humidity</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-cyan-600">
                  <CountUp end={liveData?.environment?.temperature ?? 0} duration={1000} decimals={1} />°C
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Temperature</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-blue-600">
                  <CountUp end={liveData?.environment?.humidity ?? 0} duration={1000} decimals={1} />%
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Humidity</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-100/60 text-[11px] text-gray-500 text-center">
              {isOnline ? '● Live environmental monitoring' : '○ Waiting for data...'}
            </div>
          </div>

          {/* MQ135 AQI */}
          <div className={`${getAQIBg(aqi)} rounded-2xl p-6 border border-white/50 shadow-sm flex flex-col hover:shadow-md transition-shadow ${isTransitioning ? 'opacity-75' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow">
                <Wind className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">MQ135 Sensor</p>
                <p className="text-[11px] text-gray-500">Air Quality Index</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <div className={`text-5xl font-black transition-all duration-500 ${isOnline ? 'animate-pulse' : ''} ${getAQIColor(aqi)}`}>
                <CountUp end={aqiValue} duration={1000} />
              </div>
              <div className={`text-base font-semibold mt-2 ${getAQIColor(aqi)}`}>
                {liveData?.mq135?.raw ? getMQ135Status(liveData.mq135.raw) : getAQILabel(aqi)}
              </div>
              <div className="text-xs text-gray-500 mt-1">AQI</div>
            </div>
            {liveData?.mq135 && (
              <div className="mt-3 pt-3 border-t border-white/50 grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-center">
                  <span className="text-gray-500">Raw:</span>{' '}
                  <span className="font-bold text-orange-700">{liveData.mq135.raw}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-500">Volt:</span>{' '}
                  <span className="font-bold text-orange-700">{liveData.mq135.volt?.toFixed(3)}V</span>
                </div>
              </div>
            )}
          </div>

          {/* MG811 CO2 */}
          <div className={`bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm flex flex-col hover:shadow-md transition-shadow ${isTransitioning ? 'opacity-75' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow">
                <Gauge className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">MG811 Sensor</p>
                <p className="text-[11px] text-gray-500">CO₂ Concentration</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <div className={`text-5xl font-black transition-all duration-500 ${isOnline ? 'animate-pulse' : ''} ${getCO2Color(co2Ppm)}`}>
                <CountUp end={co2Value} duration={1000} />
              </div>
              <div className={`text-base font-semibold mt-2 ${getCO2Color(co2Ppm)}`}>
                {validCo2 ? validCo2.status : getCO2Label(co2Ppm)}
              </div>
              <div className="text-xs text-gray-500 mt-1">ppm CO₂</div>
            </div>
            {validCo2 && (
              <div className="mt-3 pt-3 border-t border-blue-100 text-[11px] text-gray-600 text-center leading-relaxed">
                {validCo2.healthAdvice}
              </div>
            )}
            {!validCo2 && (
              <div className="mt-3 pt-3 border-t border-blue-100 text-[11px] text-gray-400 text-center">
                Waiting for MG811 sensor data…
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 4: SECONDARY SENSOR CARDS ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

          {/* MPU6050 Motion */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-cream-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <p className="font-bold text-gray-800 text-sm">MPU6050 Motion</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                {liveData && (Math.abs(liveData.imu.ax ?? 0) > 15000 || Math.abs(liveData.imu.ay ?? 0) > 15000) ? 'Moving' : 'Stable'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs flex-1">
              {(['ax', 'ay', 'az'] as const).map(axis => (
                <div key={axis} className="bg-purple-50 rounded-xl p-2.5 text-center border border-purple-100">
                  <div className="text-gray-500 uppercase text-[10px]">{axis}</div>
                  <div className="font-bold text-purple-700 mt-0.5">{liveData?.imu?.[axis] ?? '—'}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Accelerometer readings (raw ADC)</p>
          </div>

          {/* GPS */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-cream-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="font-bold text-gray-800 text-sm">GPS Location</p>
              </div>
              {liveData?.location && liveData.location.lat === 0 && (
                <span className="text-[10px] text-orange-500 font-semibold">No Fix</span>
              )}
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: 'Latitude', value: liveData?.location?.lat != null ? liveData.location.lat.toFixed(6) : '0.000000' },
                { label: 'Longitude', value: liveData?.location?.lng != null ? liveData.location.lng.toFixed(6) : '0.000000' },
                { label: 'Speed', value: `${liveData?.location?.speed != null ? liveData.location.speed.toFixed(1) : '0.0'} km/h` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-xs bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-bold text-emerald-700 font-mono">{value}</span>
                </div>
              ))}
            </div>
            {liveData?.location && liveData.location.lat === 0 && (
              <p className="text-[11px] text-orange-500 mt-2">Waiting for GPS fix (indoor environment)</p>
            )}
          </div>

          {/* Health Advisory */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-cream-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <p className="font-bold text-gray-800 text-sm">Health Advisory</p>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <p className="text-sm text-gray-600 leading-relaxed">{healthAdvice}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-cream-200">
                <Activity className={`h-4 w-4 ${isOnline ? 'text-green-500 animate-pulse' : 'text-gray-300'}`} />
                <span className="text-xs font-medium text-gray-600">
                  {isOnline ? 'Multi-sensor live monitoring' : 'Waiting for data...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 5: LIVE FEED STRIP ───────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-cream-200 px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Sensor Feed</p>
          <div className="flex flex-wrap gap-2">
            {liveData?.environment && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-xs text-cyan-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                DHT11: {liveData.environment?.temperature ?? 0}°C · {liveData.environment?.humidity ?? 0}%
              </div>
            )}
            {liveData?.mq135 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs text-orange-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                MQ135: {getMQ135Status(liveData.mq135.raw ?? 0)} · AQI {convertRawToAQI(liveData.mq135.raw ?? 0)}
              </div>
            )}
            {liveData?.co2 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                MG811: {liveData.co2.status} · {liveData.co2.ppm} ppm
              </div>
            )}
            {liveData?.imu && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs text-purple-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                MPU6050: ax={liveData.imu.ax} ay={liveData.imu.ay}
              </div>
            )}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
              {isOnline ? 'ESP32 Active · All sensors online' : 'ESP32 Offline'}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{lastUpdated}</p>
        </div>

        {/* ── ROW 6: HISTORY CHART ─────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-cream-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Historical Sensor Data</h2>
              <p className="text-xs text-gray-500 mt-0.5">CO₂ · AQI · Temperature over time</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 6, 24].map(h => (
                <button
                  key={h}
                  onClick={() => setHistoryHours(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyHours === h
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                  }`}
                >
                  {h === 1 ? '1h' : h === 6 ? '6h' : '24h'}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm gap-3">
              <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
              Loading sensor history…
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Activity className="w-9 h-9 opacity-25" />
              <p className="text-sm font-medium">No readings in the last {historyHours === 1 ? '1 hour' : `${historyHours} hours`}</p>
              <p className="text-xs opacity-60">Connect your ESP32 sensor to start seeing data here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  minTickGap={40}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="co2" stroke="#3b82f6" strokeWidth={2} dot={false} name="CO₂ (ppm)" connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="aqi" stroke="#f97316" strokeWidth={2} dot={false} name="AQI" connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#06b6d4" strokeWidth={2} dot={false} name="Temp (°C)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>{/* end max-w-6xl */}

      {/* Email verification modal */}
      <VerifyEmailModal open={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
    </div>
  );
};

export default Dashboard;
