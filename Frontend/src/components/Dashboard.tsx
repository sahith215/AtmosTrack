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
import io from 'socket.io-client';

// 🔥 UPDATED: Real backend interface matching your new /api/sensor-data structure
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

const Dashboard: React.FC = () => {
  const [aqiValue, setAqiValue] = useState(0);
  const [co2Value, setCo2Value] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [liveData, setLiveData] = useState<SensorData | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // ✅ new: last phone location (for heading display)
  const [latestPhoneLocation, setLatestPhoneLocation] =
    useState<{ lat: number; lng: number } | null>(null);

  // 🔥 Convert MQ135 raw to AQI (0-4095 → 0-500)
  const convertRawToAQI = (rawValue: number): number => {
    const aqi = Math.floor((rawValue / 4095) * 500);
    return Math.max(0, Math.min(500, aqi));
  };

  // 🔥 Get MQ135 status from raw value
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

  // Socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to AtmosTrack backend');
      setIsOnline(true);
    });

    newSocket.on('sensorUpdate', (data: SensorData) => {
      console.log('📊 Real multi-sensor data:', data);
      setLiveData(data);
    });

    newSocket.on('disconnect', () => {
      setIsOnline(false);
    });

    fetchLatestData();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchLatestData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/latest');
      const result = await response.json();

      if (result.success && result.data) {
        setLiveData(result.data);
        setIsOnline(result.isOnline);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // ✅ new: on mount, restore phone location from localStorage and re-sync backend
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

  // Derived “single station” values from liveData
  const aqi = liveData?.mq135?.raw ? convertRawToAQI(liveData.mq135.raw) : 0;
  const co2Ppm = liveData?.co2?.ppm ?? 0;
  const lastUpdated = liveData ? getTimeAgo(liveData.timestamp) : 'No data';
  const healthAdvice = liveData?.co2?.healthAdvice ?? 'Waiting for live sensor data...';

  // Animate AQI and CO2 values
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

  const getStatusBadgeColor = (status: string) => {
    if (status === 'Live Monitoring') return 'bg-green-100 text-green-700';
    if (status === 'Offline') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Use liveData.deviceId (if any) as selected node for location setting
  const selectedDeviceId = liveData?.deviceId ?? null;

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
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
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real-time multi-sensor monitoring from your AtmosTrack Mobile Sensor Node with ESP32 +
          DHT11 + MQ135 + MG811 + MPU6050 + GPS integration.
        </p>
      </div>

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

      {/* Hero Cards: DHT11, MQ135, MG811 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DHT11 card (always rendered) */}
        <div
          className={`
            bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl p-8 shadow-lg backdrop-blur-sm 
            border border-white/50 transform hover:scale-[1.02] transition-all duration-300
          `}
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

            {/* ✅ new heading-style phone coordinates */}
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

          {/* phone-based location setter */}
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
                  🌡️ DHT11: {liveData.environment.temperature}°C,{' '}
                  {liveData.environment.humidity}% RH
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
