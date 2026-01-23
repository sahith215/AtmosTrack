import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
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
import { User } from '../types/user';
import { useRealtime } from '../contexts/RealtimeContext';
import type { LiveReading } from '../types/LiveReading';

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

// ---------- email verification inner component (top-level) ----------
const API_BASE = 'http://localhost:5000';

const EmailVerifyInner: React.FC<{
  email: string;
  onVerified: (user: User) => void;
}> = ({ email, onVerified }) => {
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'sent'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.log('request-verification fail', data);
        setError(data.error || 'Failed to send verification code');
        return;
      }
      setStep('sent');
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.log('verify-email fail', data);
        setError(data.error || 'Invalid or expired code');
        return;
      }
      onVerified(data.user as User);
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={handleSendCode}
        disabled={loading}
        className="w-full rounded-xl bg-amber-400 text-slate-900 text-xs font-semibold px-3 py-2 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading && step === 'idle'
          ? 'Sending...'
          : step === 'idle'
          ? 'Send code to my email'
          : 'Resend code'}
      </button>

      {step === 'sent' && (
        <>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-200">
              Enter 6‑digit code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="123456"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full rounded-xl bg-emerald-400 text-slate-900 text-xs font-semibold px-3 py-2 hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </>
      )}

      {error && (
        <p className="text-[11px] text-rose-300 mt-1">{error}</p>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, setUser } = useAuth(); // make sure AuthContext exposes setUser
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

  const [latestPhoneLocation, setLatestPhoneLocation] =
    useState<{ lat: number; lng: number } | null>(null);

  // NEW: banner / modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [hideVerifyBanner, setHideVerifyBanner] = useState(false);

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

  // Drive online status from shared connection status
  useEffect(() => {
    setIsOnline(status === 'connected');
  }, [status]);

  // on mount, restore phone location from localStorage and re-sync backend
  useEffect(() => {
    const saved = localStorage.getItem('atmostrack-phone-location');
    if (!saved) return;
    const { lat, lng, deviceId } = JSON.parse(saved);

    setLatestPhoneLocation({ lat, lng });

    fetch('http://localhost:5000/api/nodes/set-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceId ?? 'ATMOSTRACK-01',
        lat,
        lng,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  // Derived values from liveData
  const aqi = liveData?.mq135?.raw ? convertRawToAQI(liveData.mq135.raw) : 0;
  const co2Ppm = liveData?.co2?.ppm ?? 0;
  const lastUpdated = liveData ? getTimeAgo(liveData.timestamp) : 'No data';
  const healthAdvice =
    liveData?.co2?.healthAdvice ?? 'Waiting for live sensor data...';

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

  const getStatusBadgeColor = (statusLabel: string) => {
    if (statusLabel === 'Live Monitoring') return 'bg-green-100 text-green-700';
    if (statusLabel === 'Offline') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Use liveData.deviceId as selected node
  const selectedDeviceId = liveData?.deviceId ?? null;

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center space-y-2 mb-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-bold text-gray-800">AtmosTrack Live Dashboard</h1>
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isOnline ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-700'
              }`}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Account summary line with lastLogin */}
          <p className="text-xs text-gray-500">
            Signed in as <span className="font-semibold">{user?.name}</span> ({user?.role}) · Last
            login:{' '}
            {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First time login'}
          </p>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your city’s pollution can run, but it can’t hide from this dashboard.
        </p>
      </div>

      {/* Email verification teaser banner */}
      {!hideVerifyBanner && user && user.emailVerified === false && (
        <div className="max-w-4xl mx-auto mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-900 px-4 py-3 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase">
              Verify your email to unlock exports &amp; Carbon Hub
            </p>
            <p className="text-xs sm:text-sm opacity-90">
              We use verification to protect your AtmosTrack credits and account activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-semibold hover:bg-slate-800 transition"
            >
              Verify now
            </button>
            <button
              onClick={() => setHideVerifyBanner(true)}
              className="text-[11px] text-slate-900/80 hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Station info (no dropdown) */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-lg font-semibold text-gray-800">Current Station</p>
                <p className="text-sm text-gray-600">
                  AtmosTrack Mobile Sensor Node {selectedDeviceId && `• ${selectedDeviceId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                  isOnline ? 'Live Monitoring' : 'Offline',
                )}`}
              >
                {isOnline ? 'Live Monitoring' : 'Offline'}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Updated {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account details card – gradient, chip, badges */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-600 text-[11px] font-semibold text-slate-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Account connected
            </div>
            <h3 className="text-lg font-semibold text-white">
              {user?.name || 'AtmosTrack user'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-200 border border-slate-600">
                Role:&nbsp;
                <span className="font-semibold capitalize">{user?.role}</span>
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${
                  user?.emailVerified
                    ? 'bg-emerald-500/10 border-emerald-400 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-400 text-amber-200'
                }`}
              >
                {user?.emailVerified ? 'Email verified' : 'Email not verified'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-600 text-slate-200">
                Last login:&nbsp;
                <span className="font-mono">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First session'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Quick actions
            </span>
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 text-xs font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition"
            >
              Manage profile
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-100 text-xs font-medium border border-slate-600 hover:bg-slate-700 transition"
            >
              View account activity
            </button>
          </div>
        </div>
      </div>

      {/* Hero Cards: DHT11, MQ135, MG811 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DHT11 card */}
        <div
          className="
            bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl p-8 shadow-lg backdrop-blur-sm 
            border border-white/50 transform hover:scale-[1.02] transition-all duration-300
          "
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Thermometer className="h-8 w-8 text-cyan-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-700">DHT11 Sensor</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-3xl font-bold text-cyan-600">
                  <CountUp
                    end={liveData?.environment?.temperature ?? 0}
                    duration={1000}
                    decimal="."
                    decimals={1}
                  />
                  °C
                </div>
                <div className="text-sm text-gray-600 mt-1">Temperature</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  <CountUp
                    end={liveData?.environment?.humidity ?? 0}
                    duration={1000}
                    decimal="."
                    decimals={1}
                  />
                  %
                </div>
                <div className="text-sm text-gray-600 mt-1">Humidity</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/50 text-xs text-gray-500">
              {isOnline ? 'Live environmental monitoring' : 'Waiting for data...'}
            </div>
          </div>
        </div>

        {/* MQ135 card */}
        <div
          className={`
            ${getAQIBg(aqi)} rounded-3xl p-8 shadow-lg backdrop-blur-sm 
            border border-white/50 transform hover:scale-[1.02] transition-all duration-300
            ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
          `}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Wind className="h-8 w-8 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-700">MQ135 Air Quality</h3>
            </div>
            <div
              className={`text-5xl font-bold mb-4 transition-all duration-500 ${
                isOnline ? 'animate-pulse' : ''
              }`}
            >
              <CountUp end={aqiValue} duration={1000} />
            </div>
            <div className={`text-xl font-semibold mb-2 ${getAQIColor(aqi)}`}>
              {liveData?.mq135?.raw ? getMQ135Status(liveData.mq135.raw) : getAQILabel(aqi)}
            </div>
            <div className="text-gray-500 text-sm">Air Quality Index</div>
            {liveData?.mq135 && (
              <div className="mt-4 pt-4 border-t border-white/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Raw:</span>
                    <span className="font-semibold ml-2 text-orange-600">
                      {liveData.mq135.raw}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Volt:</span>
                    <span className="font-semibold ml-2 text-orange-600">
                      {liveData.mq135.volt?.toFixed(3)}V
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MG811 card */}
        <div
          className={`
            bg-blue-100 rounded-3xl p-8 shadow-lg backdrop-blur-sm 
            border border-white/50 transform hover:scale-[1.02] transition-all duration-300
            ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
          `}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Gauge className="h-8 w-8 text-blue-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-700">MG811 CO₂</h3>
            </div>
            <div
              className={`text-5xl font-bold mb-4 transition-all duration-500 ${
                isOnline ? 'animate-pulse' : ''
              }`}
            >
              <CountUp end={co2Value} duration={1000} />
            </div>
            <div className={`text-xl font-semibold mb-2 ${getCO2Color(co2Ppm)}`}>
              {liveData?.co2 ? liveData.co2.status : getCO2Label(co2Ppm)}
            </div>
            <div className="text-gray-500 text-sm">CO₂ Concentration (ppm)</div>
            {liveData?.co2 && (
              <div className="mt-4 pt-4 border-t border-white/50 text-sm text-gray-600">
                {liveData.co2.healthAdvice}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* MPU6050 card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">MPU6050 Motion</h3>
            <Zap className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-gray-600">ax</div>
                <div className="font-semibold text-purple-600">{liveData?.imu?.ax ?? '-'}</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-gray-600">ay</div>
                <div className="font-semibold text-purple-600">{liveData?.imu?.ay ?? '-'}</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-gray-600">az</div>
                <div className="font-semibold text-purple-600">{liveData?.imu?.az ?? '-'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-purple-600">
                {liveData &&
                (Math.abs(liveData.imu.ax ?? 0) > 15000 ||
                  Math.abs(liveData.imu.ay ?? 0) > 15000)
                  ? 'Moving'
                  : 'Stable'}
              </span>
            </div>
            <div className="text-xs text-gray-500">Accelerometer readings (raw ADC)</div>
          </div>
        </div>

        {/* GPS Location Card + phone-location button */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {liveData?.location?.lat != null &&
              liveData.location.lat !== 0 &&
              liveData.location.lng != null &&
              liveData.location.lng !== 0
                ? 'Current node (phone-linked)'
                : 'GPS / Location'}
            </h3>
            <Navigation className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Latitude:</span>
              <span className="font-semibold text-green-600">
                {liveData?.location?.lat != null
                  ? liveData.location.lat.toFixed(6)
                  : '0.000000'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Longitude:</span>
              <span className="font-semibold text-green-600">
                {liveData?.location?.lng != null
                  ? liveData.location.lng.toFixed(6)
                  : '0.000000'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Speed:</span>
              <span className="font-semibold text-green-600">
                {liveData?.location?.speed != null
                  ? liveData.location.speed.toFixed(1)
                  : '0.0'}{' '}
                km/h
              </span>
            </div>
            {liveData?.location &&
              liveData.location.lat === 0 &&
              liveData.location.lng === 0 && (
                <div className="text-xs text-orange-500 mt-2">
                  Waiting for GPS fix (indoor environment)
                </div>
              )}

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Phone-linked node location
              </div>
              {latestPhoneLocation && (
                <div className="text-xs font-mono text-emerald-700">
                  {latestPhoneLocation.lat.toFixed(5)}, {latestPhoneLocation.lng.toFixed(5)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-cream-200">
            <NodeLocationSetter
              selectedDeviceId={selectedDeviceId}
              onPhoneLocationChange={(loc) => setLatestPhoneLocation(loc)}
            />
          </div>
        </div>

        {/* Health Advisory Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Health Advisory</h3>
            <Shield className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 leading-relaxed">{healthAdvice}</div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              ) : (
                <Activity className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {isOnline ? 'Multi-sensor live monitoring' : 'Waiting for data...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Updates Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Live Sensor Updates</h2>
        <div className="space-y-4">
         {liveData?.environment && (
  <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4">
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
    <div className="flex-1">
      <p className="text-gray-800">
        🌡️ DHT11: {liveData.environment?.temperature ?? 0}°C,{' '}
        {liveData.environment?.humidity ?? 0}% RH
      </p>
      <p className="text-sm text-gray-500">{getTimeAgo(liveData.timestamp)}</p>
    </div>
  </div>
)}



          {liveData?.mq135 && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-gray-800">
                  🟠 MQ135: {getMQ135Status(liveData.mq135.raw ?? 0)} (Raw:{' '}
                  {liveData.mq135.raw}, AQI: {convertRawToAQI(liveData.mq135.raw ?? 0)})
                </p>
                <p className="text-sm text-gray-500">{getTimeAgo(liveData.timestamp)}</p>
              </div>
            </div>
          )}

          {liveData?.co2 && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-gray-800">
                  🔵 MG811: {liveData.co2.status} ({liveData.co2.ppm} ppm CO₂)
                </p>
                <p className="text-sm text-gray-500">{getTimeAgo(liveData.timestamp)}</p>
              </div>
            </div>
          )}

          {liveData?.imu && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-gray-800">
                  ⚡ MPU6050: ax={liveData.imu.ax} ay={liveData.imu.ay} az={liveData.imu.az}
                </p>
                <p className="text-sm text-gray-500">Motion sensor active</p>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-gray-800">
                System Status: {isOnline ? '🟢 ESP32 Multi-Sensor Active' : '🔴 ESP32 Offline'}
              </p>
              <p className="text-sm text-gray-500">
                DHT11 + MQ135 + MG811 + MPU6050 + GPS real hardware
              </p>
            </div>
          </div>
        </div>
      </div>

      {showVerifyModal && user && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Verify your email</h2>
                <p className="mt-1 text-xs text-slate-300">
                  A 6‑digit code will be sent to{' '}
                  <span className="font-medium text-amber-300">{user.email}</span>.
                </p>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <EmailVerifyInner
              email={user.email}
              onVerified={(updatedUser) => {
                setUser?.((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
                setHideVerifyBanner(true);
                setShowVerifyModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/** Phone-based location setter component */
const NodeLocationSetter: React.FC<{
  selectedDeviceId: string | null;
  onPhoneLocationChange: (loc: { lat: number; lng: number }) => void;
}> = ({ selectedDeviceId, onPhoneLocationChange }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const setLocationFromPhone = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported in this browser');
      return;
    }

    if (!selectedDeviceId) {
      alert('No device selected');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { lat: latitude, lng: longitude };

        setUserLocation(loc);
        onPhoneLocationChange(loc);
        console.log('Phone location for device', selectedDeviceId, latitude, longitude);

        localStorage.setItem(
          'atmostrack-phone-location',
          JSON.stringify({
            lat: latitude,
            lng: longitude,
            deviceId: selectedDeviceId,
          }),
        );

        try {
          await fetch('http://localhost:5000/api/nodes/set-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: selectedDeviceId,
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error('Error sending phone location', e);
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error getting location', error);
        alert('Could not get location. Please enable location permission.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  if (!selectedDeviceId) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={setLocationFromPhone}
        disabled={loading}
        className="px-3 py-2 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
      >
        {loading ? 'Getting phone location…' : 'Use my phone location for this node'}
      </button>
      {userLocation && (
        <p className="text-xs text-gray-600">
          Phone location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
