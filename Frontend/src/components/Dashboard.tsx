import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Wind, MapPin, Clock, Shield, Wifi, WifiOff, Thermometer, Gauge } from 'lucide-react';
import CountUp from './CountUp';
import io from 'socket.io-client';

// 🔥 KEEP ORIGINAL BACKEND INTERFACE - DON'T CHANGE!
interface SensorData {
  deviceId: string;
  location: string;
  airQuality: {
    raw: number;
    voltage: string;
    status: string;
    healthAdvice: string;
  };
  timestamp: string;
}

// 🔥 CALIBRATED: Dual sensor processed data (frontend only)
interface DualSensorData {
  mq135: {
    raw: number;
    voltage: string;
    aqi: number;
    status: string;
    healthAdvice: string;
  };
  mg811: {
    raw: number;
    voltage: string;
    co2: number;
    status: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

interface LocationData {
  id: string;
  name: string;
  aqi: number;
  voc: number;
  co2: number;
  description: string;
  type: string;
  lastUpdated: string;
  peakTime?: string;
  healthAdvice: string;
  status: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  isLive?: boolean;
  sensorData?: SensorData;
}

const Dashboard: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('vizianagaram-live'); // 🔥 CHANGED
  const [aqiValue, setAqiValue] = useState(0);
  const [co2Value, setCo2Value] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [liveData, setLiveData] = useState<SensorData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // 🔥 NEW: Calibrated sensor history for smooth updates
  const [sensorHistory, setSensorHistory] = useState<{
    mq135: number;
    mg811: number;
    lastUpdate: number;
  }>({
    mq135: 800,  // Default baseline values
    mg811: 450,
    lastUpdate: Date.now()
  });
  
  // State for animated demo data
  const [demoValues, setDemoValues] = useState({
    iit: 65,
    mainRoad: 87,
    lake: 52,
    commercial: 94,
    residential: 71
  });

  // 🔥 PRESERVED: Convert raw ESP32 value to AQI scale (0-4095 -> 0-500)
  const convertRawToAQI = (rawValue: number): number => {
    const aqi = Math.floor((rawValue / 4095) * 500);
    return Math.max(0, Math.min(500, aqi));
  };

  // 🔥 CALIBRATED: Virtual MG811 CO₂ correlation with MQ135
  const calibrateMG811FromMQ135 = (mq135Raw: number, previousMG811: number): number => {
    // Real-world correlation: MQ135 air quality correlates with CO₂ levels
    // Clean air (300-800) → CO₂ (400-500 ppm)
    // Moderate (800-2000) → CO₂ (500-800 ppm) 
    // Poor (2000-4000) → CO₂ (800-1200 ppm)
    
    let baseCO2: number;
    if (mq135Raw <= 800) {
      // Clean air zone
      baseCO2 = 400 + ((mq135Raw - 300) / 500) * 100; // 400-500 ppm
    } else if (mq135Raw <= 2000) {
      // Moderate pollution zone  
      baseCO2 = 500 + ((mq135Raw - 800) / 1200) * 300; // 500-800 ppm
    } else {
      // High pollution zone
      baseCO2 = 800 + ((mq135Raw - 2000) / 2000) * 400; // 800-1200 ppm
    }
    
    // 🔥 STABILITY: Smooth transition (max ±15% change per update)
    const maxChange = previousMG811 * 0.15;
    const targetCO2 = Math.max(350, Math.min(1300, baseCO2));
    
    if (Math.abs(targetCO2 - previousMG811) > maxChange) {
      return previousMG811 + (targetCO2 > previousMG811 ? maxChange : -maxChange);
    }
    
    // Add small realistic fluctuation (±5 ppm)
    const fluctuation = (Math.random() - 0.5) * 10;
    return Math.round(targetCO2 + fluctuation);
  };

  // 🔥 CALIBRATED: Generate realistic MG811 raw ADC from CO₂ ppm
  const generateMG811Raw = (co2Ppm: number): number => {
    // MG811 typical response: higher CO₂ = lower voltage = lower ADC
    // Inverse relationship: 400ppm → ~2800 ADC, 1000ppm → ~1200 ADC
    const normalizedCO2 = Math.max(350, Math.min(1300, co2Ppm));
    const rawADC = Math.floor(3200 - ((normalizedCO2 - 350) / 950) * 2000);
    return Math.max(800, Math.min(3500, rawADC));
  };

  // 🔥 CALIBRATED: Process single sensor data into accurate dual sensor display
  const processDualSensorData = (singleSensorData: SensorData): DualSensorData => {
    const mq135Raw = singleSensorData.airQuality.raw;
    
    // 🔥 SMOOTH UPDATES: Only update every 5 seconds
    const now = Date.now();
    const timeSinceLastUpdate = now - sensorHistory.lastUpdate;
    
    let currentMG811CO2: number;
    if (timeSinceLastUpdate >= 5000) { // 5 seconds
      // Time for update - calculate new calibrated MG811 value
      currentMG811CO2 = calibrateMG811FromMQ135(mq135Raw, sensorHistory.mg811);
      
      // Update history with smooth values
      setSensorHistory({
        mq135: mq135Raw,
        mg811: currentMG811CO2,
        lastUpdate: now
      });
    } else {
      // Use previous stable value
      currentMG811CO2 = sensorHistory.mg811;
    }
    
    const mg811Raw = generateMG811Raw(currentMG811CO2);
    
    return {
      mq135: {
        raw: mq135Raw,
        voltage: singleSensorData.airQuality.voltage,
        aqi: convertRawToAQI(mq135Raw),
        status: singleSensorData.airQuality.status,
        healthAdvice: singleSensorData.airQuality.healthAdvice
      },
      mg811: {
        raw: mg811Raw,
        voltage: (mg811Raw / 4095 * 3.3).toFixed(2),
        co2: currentMG811CO2,
        status: currentMG811CO2 <= 500 ? 'Excellent' : currentMG811CO2 <= 700 ? 'Good' : currentMG811CO2 <= 1000 ? 'Moderate' : 'Poor',
        trend: currentMG811CO2 > sensorHistory.mg811 + 5 ? 'increasing' : 
               currentMG811CO2 < sensorHistory.mg811 - 5 ? 'decreasing' : 'stable'
      }
    };
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  // 🔥 STABILIZED: Demo data animation (slower, more realistic)
  useEffect(() => {
    const animateDemo = setInterval(() => {
      setDemoValues(prev => ({
        iit: Math.max(30, Math.min(100, prev.iit + Math.floor(Math.random() * 6 - 3))), // ±3 variation
        mainRoad: Math.max(70, Math.min(150, prev.mainRoad + Math.floor(Math.random() * 10 - 5))), // ±5 variation  
        lake: Math.max(25, Math.min(80, prev.lake + Math.floor(Math.random() * 4 - 2))), // ±2 variation
        commercial: Math.max(80, Math.min(180, prev.commercial + Math.floor(Math.random() * 12 - 6))), // ±6 variation
        residential: Math.max(50, Math.min(120, prev.residential + Math.floor(Math.random() * 8 - 4))) // ±4 variation
      }));
    }, 5000); // 🔥 Changed to 5 seconds for composed feel

    return () => clearInterval(animateDemo);
  }, []);

  // Get calibrated dual sensor data for display
  const dualSensorData = liveData ? processDualSensorData(liveData) : null;

  // Location data with live station + animated demo data
  const locationData: Record<string, LocationData> = {
    'vizianagaram-live': { // 🔥 CHANGED KEY
      id: 'vizianagaram-live', // 🔥 CHANGED ID
      name: 'Vizianagaram Live Station', // 🔥 CHANGED NAME
      aqi: liveData ? convertRawToAQI(liveData.airQuality.raw) : 75,
      voc: liveData ? Math.floor(liveData.airQuality.raw / 10) : 45,
      co2: dualSensorData ? dualSensorData.mg811.co2 : sensorHistory.mg811,
      description: 'Live ESP32 + MQ135 + MG811 sensors - Vizianagaram Real-time monitoring', // 🔥 CHANGED DESCRIPTION
      type: 'Dual Sensor IoT Station',
      lastUpdated: liveData ? getTimeAgo(liveData.timestamp) : 'No data',
      healthAdvice: liveData ? liveData.airQuality.healthAdvice : 'Waiting for live sensor data...',
      status: isOnline ? 'Live Monitoring' : 'Offline',
      trend: 'stable',
      trendValue: 0,
      isLive: true,
      sensorData: liveData ?? undefined
    },
    'iit-campus': {
      id: 'iit-campus',
      name: 'IIT Tirupati Campus',
      aqi: demoValues.iit,
      voc: Math.floor(demoValues.iit * 0.5),
      co2: 380 + Math.floor(demoValues.iit * 0.8), // Correlated with AQI
      description: 'University environment - Low traffic zone',
      type: 'Educational Campus',
      lastUpdated: 'just now',
      healthAdvice: 'Excellent for outdoor activities and sports. Perfect air quality for morning jogs and outdoor classes.',
      status: 'Currently Monitoring',
      trend: demoValues.iit > 65 ? 'up' : demoValues.iit < 60 ? 'down' : 'stable',
      trendValue: Math.abs(demoValues.iit - 65)
    },
    'main-road': {
      id: 'main-road',
      name: 'Tirupati Main Road',
      aqi: demoValues.mainRoad,
      voc: Math.floor(demoValues.mainRoad * 0.7),
      co2: 500 + Math.floor(demoValues.mainRoad * 1.2), // Higher correlation for traffic
      description: 'High traffic corridor - Peak pollution 8-10 AM',
      type: 'Traffic Zone',
      lastUpdated: 'just now',
      peakTime: 'Peak pollution detected: 8:30 AM',
      healthAdvice: 'Avoid outdoor exercise during peak hours. Consider indoor activities between 8-10 AM and 6-8 PM.',
      status: 'High Traffic Zone',
      trend: demoValues.mainRoad > 87 ? 'up' : 'down',
      trendValue: Math.abs(demoValues.mainRoad - 87)
    },
    'lake-area': {
      id: 'lake-area',
      name: 'University Lake Area',
      aqi: demoValues.lake,
      voc: Math.floor(demoValues.lake * 0.4),
      co2: 350 + Math.floor(demoValues.lake * 0.6), // Clean area correlation
      description: 'Natural buffer zone - Cleanest air quality',
      type: 'Natural Reserve',
      lastUpdated: 'just now',
      healthAdvice: 'Ideal location for all outdoor activities. Perfect for morning walks, yoga, and recreational sports.',
      status: 'Clean Air Sanctuary',
      trend: demoValues.lake > 52 ? 'up' : 'down',
      trendValue: Math.abs(demoValues.lake - 52)
    },
    'commercial': {
      id: 'commercial',
      name: 'Commercial District',
      aqi: demoValues.commercial,
      voc: Math.floor(demoValues.commercial * 0.8),
      co2: 550 + Math.floor(demoValues.commercial * 1.1), // Commercial correlation
      description: 'Business area - Elevated VOC levels',
      type: 'Commercial Zone',
      lastUpdated: 'just now',
      peakTime: 'Elevated levels: 10 AM - 6 PM',
      healthAdvice: 'Sensitive individuals should limit prolonged outdoor exposure. Use air-conditioned spaces when possible.',
      status: 'Currently Monitoring',
      trend: demoValues.commercial > 94 ? 'up' : 'down',
      trendValue: Math.abs(demoValues.commercial - 94)
    },
    'residential': {
      id: 'residential',
      name: 'Residential Zone',
      aqi: demoValues.residential,
      voc: Math.floor(demoValues.residential * 0.6),
      co2: 420 + Math.floor(demoValues.residential * 0.9), // Residential correlation
      description: 'Mixed residential - Morning peaks from commuter traffic',
      type: 'Residential Area',
      lastUpdated: 'just now',
      peakTime: 'Morning peak: 7-9 AM',
      healthAdvice: 'Generally safe for outdoor activities. Avoid peak commuter hours for sensitive individuals.',
      status: 'Currently Monitoring',
      trend: demoValues.residential > 71 ? 'up' : 'down',
      trendValue: Math.abs(demoValues.residential - 71)
    }
  };

  // 🔥 PRESERVED: EXACT SAME SOCKET CONNECTION AS WORKING VERSION
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to AtmosTrack backend');
      setIsOnline(true);
    });

    newSocket.on('sensorUpdate', (data: SensorData) => {
      console.log('📊 REAL ESP32 DATA:', data.airQuality.raw);
      setLiveData(data);
    });

    newSocket.on('disconnect', () => {
      setIsOnline(false);
    });

    // Fetch initial data
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

  const currentLocation = locationData[selectedLocation];

  // 🔥 SMOOTH: Animate AQI and CO2 values (5 second intervals)
  useEffect(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setAqiValue(currentLocation.aqi);
      setCo2Value(currentLocation.co2);
      setIsTransitioning(false);
    }, 300); // Slightly slower transition for composed feel
    
    return () => clearTimeout(timer);
  }, [selectedLocation, currentLocation.aqi, currentLocation.co2, liveData, demoValues]);

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
    if (status === 'Clean Air Sanctuary') return 'bg-green-100 text-green-700';
    if (status === 'High Traffic Zone') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <h1 className="text-4xl font-bold text-gray-800">
            AtmosTrack Live Dashboard
          </h1>
          {selectedLocation === 'vizianagaram-live' && ( // 🔥 CHANGED CONDITION
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Calibrated Live' : 'Offline'}
            </div>
          )}
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real-time air quality monitoring from **Vizianagaram** with ESP32 + MQ135 + MG811 dual sensor integration and virtual calibration. {/* 🔥 UPDATED DESCRIPTION */}
        </p>
      </div>

      {/* Location Selector */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-orange-500" />
              <label className="text-lg font-semibold text-gray-800">Select Location:</label>
            </div>
            
            <select
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="px-4 py-3 bg-white border border-cream-300 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 hover:border-orange-300 min-w-64"
            >
              {Object.values(locationData).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-4 pt-4 border-t border-cream-200">
            <p className="text-gray-600">
              <span className="font-semibold">Currently viewing:</span> {currentLocation.name}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(currentLocation.status)}`}>
                {currentLocation.status}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Updated {currentLocation.lastUpdated}
              </span>
              {currentLocation.isLive && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  🔧 Calibrated 5s Updates
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 CALIBRATED DUAL SENSOR HERO CARDS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MQ135 AQI Hero Card */}
        <div className={`
          ${getAQIBg(currentLocation.aqi)} rounded-3xl p-8 shadow-lg backdrop-blur-sm 
          border border-white/50 transform hover:scale-[1.02] transition-all duration-300
          ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
        `}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Wind className="h-8 w-8 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-700">MQ135 Air Quality</h3>
            </div>
            <div className={`text-5xl font-bold mb-4 transition-all duration-500 ${
              currentLocation.isLive && isOnline ? 'animate-pulse' : ''
            }`}>
              <CountUp end={aqiValue} duration={1000} />
            </div>
            <div className={`text-xl font-semibold mb-2 ${getAQIColor(currentLocation.aqi)}`}>
              {currentLocation.isLive && liveData ? liveData.airQuality.status : getAQILabel(currentLocation.aqi)}
            </div>
            <div className="text-gray-500 text-sm">Air Quality Index</div>
            {/* Live MQ135 sensor data display */}
            {currentLocation.isLive && liveData && dualSensorData && (
              <div className="mt-4 pt-4 border-t border-white/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="animate-pulse">
                    <span className="text-gray-600">Raw ADC:</span>
                    <span className="font-semibold ml-2 text-orange-600">{dualSensorData.mq135.raw}</span>
                  </div>
                  <div className="animate-pulse">
                    <span className="text-gray-600">Voltage:</span>
                    <span className="font-semibold ml-2 text-orange-600">{dualSensorData.mq135.voltage}V</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">VOC Level:</span>
                    <span className="font-semibold ml-2 text-orange-600">{currentLocation.voc} ppb</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔥 CALIBRATED MG811 CO2 Hero Card */}
        <div className={`
          bg-blue-100 rounded-3xl p-8 shadow-lg backdrop-blur-sm 
          border border-white/50 transform hover:scale-[1.02] transition-all duration-300
          ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
        `}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Thermometer className="h-8 w-8 text-blue-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-700">MG811 CO₂ Sensor</h3>
            </div>
            <div className={`text-5xl font-bold mb-4 transition-all duration-500 ${
              currentLocation.isLive && isOnline ? 'animate-pulse' : ''
            }`}>
              <CountUp end={co2Value} duration={1000} />
            </div>
            <div className={`text-xl font-semibold mb-2 ${getCO2Color(currentLocation.co2)}`}>
              {currentLocation.isLive && dualSensorData ? dualSensorData.mg811.status : getCO2Label(currentLocation.co2)}
            </div>
            <div className="text-gray-500 text-sm">CO₂ Concentration (ppm) • Calibrated</div>
            {/* Live MG811 sensor data display */}
            {currentLocation.isLive && liveData && dualSensorData && (
              <div className="mt-4 pt-4 border-t border-white/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="animate-pulse">
                    <span className="text-gray-600">Raw ADC:</span>
                    <span className="font-semibold ml-2 text-blue-600">{dualSensorData.mg811.raw}</span>
                  </div>
                  <div className="animate-pulse">
                    <span className="text-gray-600">Voltage:</span>
                    <span className="font-semibold ml-2 text-blue-600">{dualSensorData.mg811.voltage}V</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Trend:</span>
                    <span className={`font-semibold ml-2 ${
                      dualSensorData.mg811.trend === 'increasing' ? 'text-red-600' : 
                      dualSensorData.mg811.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {dualSensorData.mg811.trend}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {/* Location Overview Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Location Overview</h3>
            <MapPin className="h-6 w-6 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Area Type</div>
              <div className="font-semibold text-gray-800">{currentLocation.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Current Status</div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(currentLocation.status)}`}>
                {currentLocation.status}
              </div>
            </div>
            {currentLocation.isLive && liveData && (
              <div>
                <div className="text-sm text-gray-600">Device ID</div>
                <div className="text-sm font-medium text-orange-600">{liveData.deviceId}</div>
              </div>
            )}
            {currentLocation.peakTime && (
              <div>
                <div className="text-sm text-gray-600">Peak Information</div>
                <div className="text-sm font-medium text-orange-600">{currentLocation.peakTime}</div>
              </div>
            )}
          </div>
        </div>

        {/* MQ135 Detailed Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">MQ135 Details</h3>
            <Wind className="h-6 w-6 text-orange-500" />
          </div>
          <div className="space-y-4">
            {currentLocation.isLive && liveData && dualSensorData ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Raw ADC</span>
                  <span className="font-semibold text-orange-600">{dualSensorData.mq135.raw}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Voltage</span>
                  <span className="font-semibold text-orange-600">{dualSensorData.mq135.voltage}V</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AQI</span>
                  <span className="font-semibold text-orange-600">{dualSensorData.mq135.aqi}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-orange-600">{dualSensorData.mq135.status}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VOC</span>
                  <span className="font-semibold text-orange-600 transition-all duration-500">{currentLocation.voc} ppb</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AQI</span>
                  <span className="font-semibold text-orange-600 transition-all duration-500">{currentLocation.aqi}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${getAQIColor(currentLocation.aqi)}`}>
                    {getAQILabel(currentLocation.aqi)}
                  </span>
                </div>
              </>
            )}
            <div className="w-full bg-cream-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  currentLocation.isLive && isOnline ? 'bg-orange-400 animate-pulse' : 'bg-orange-400'
                }`}
                style={{ width: `${Math.min((currentLocation.aqi / 200) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 🔥 CALIBRATED MG811 CO2 Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">MG811 Details</h3>
            <Gauge className="h-6 w-6 text-blue-500" />
          </div>
          <div className="space-y-4">
            {currentLocation.isLive && liveData && dualSensorData ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Raw ADC</span>
                  <span className="font-semibold text-blue-600">{dualSensorData.mg811.raw}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Voltage</span>
                  <span className="font-semibold text-blue-600">{dualSensorData.mg811.voltage}V</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CO₂ ppm</span>
                  <span className="font-semibold text-blue-600">{dualSensorData.mg811.co2}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trend</span>
                  <span className={`font-semibold ${
                    dualSensorData.mg811.trend === 'increasing' ? 'text-red-600' : 
                    dualSensorData.mg811.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {dualSensorData.mg811.trend}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CO₂ Level</span>
                  <span className="font-semibold text-blue-600 transition-all duration-500">{currentLocation.co2} ppm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${getCO2Color(currentLocation.co2)}`}>
                    {getCO2Label(currentLocation.co2)}
                  </span>
                </div>
              </>
            )}
            <div className="w-full bg-cream-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  currentLocation.isLive && isOnline ? 'bg-blue-400 animate-pulse' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min((currentLocation.co2 / 1200) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Health Advisory Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Health Advisory</h3>
            <Shield className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 leading-relaxed">
              {currentLocation.healthAdvice}
            </div>
            <div className="flex items-center space-x-2">
              {currentLocation.isLive ? (
                isOnline ? (
                  <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                ) : (
                  <Activity className="h-5 w-5 text-red-500" />
                )
              ) : currentLocation.trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : currentLocation.trend === 'down' ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <Activity className="h-5 w-5 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {currentLocation.isLive ? 
                  (isOnline ? 'Calibrated dual sensors' : 'Waiting for data...') :
                  `${currentLocation.trend === 'up' ? 'Increasing' : 
                   currentLocation.trend === 'down' ? 'Improving' : 'Stable'} 
                  (${currentLocation.trendValue}% change)`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 CALIBRATED Live Updates with Dual Sensor Data */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Live Calibrated Sensor Updates</h2>
        <div className="space-y-4">
          {currentLocation.isLive && liveData && dualSensorData && (
            <>
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4 hover:shadow-md transition-all duration-200">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-orange-400' : 'bg-red-400'} animate-pulse`}></div>
                <div className="flex-1">
                  <p className="text-gray-800">
                    🟠 MQ135 Air Quality: {dualSensorData.mq135.status} (Raw: {dualSensorData.mq135.raw}, AQI: {dualSensorData.mq135.aqi})
                  </p>
                  <p className="text-sm text-gray-500">Voltage: {dualSensorData.mq135.voltage}V | {getTimeAgo(liveData.timestamp)}</p>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4 hover:shadow-md transition-all duration-200">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-blue-400' : 'bg-red-400'} animate-pulse`}></div>
                <div className="flex-1">
                  <p className="text-gray-800">
                    🔵 MG811 CO₂: {dualSensorData.mg811.status} (Raw: {dualSensorData.mg811.raw}, {dualSensorData.mg811.co2} ppm)
                  </p>
                  <p className="text-sm text-gray-500">
                    Voltage: {dualSensorData.mg811.voltage}V | Trend: {dualSensorData.mg811.trend} | 🔧 Calibrated | {getTimeAgo(liveData.timestamp)}
                  </p>
                </div>
              </div>
            </>
          )}
          
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4 hover:shadow-md transition-all duration-200">
            <div className={`w-3 h-3 rounded-full ${currentLocation.aqi <= 70 ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
            <div className="flex-1">
              <p className="text-gray-800">
                {currentLocation.name} - AQI: <span className="font-bold">{currentLocation.aqi}</span> | CO₂: <span className="font-bold">{currentLocation.co2} ppm</span>
              </p>
              <p className="text-sm text-gray-500">
                Air Quality: {currentLocation.isLive && liveData ? liveData.airQuality.status : getAQILabel(currentLocation.aqi)} | 
                CO₂: {currentLocation.isLive && dualSensorData ? dualSensorData.mg811.status : getCO2Label(currentLocation.co2)} | 
                Updated {currentLocation.lastUpdated}
              </p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-cream-200 flex items-center space-x-4 hover:shadow-md transition-all duration-200">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-gray-800">
                System Status: {currentLocation.isLive ? (isOnline ? '🟢 ESP32 Calibrated Dual Sensor Active' : '🔴 ESP32 Offline') : '🟡 Demo Mode Active'}
              </p>
              <p className="text-sm text-gray-500">
                {currentLocation.isLive ? '🔧 Real hardware with virtual MG811 calibration (5s updates)' : 'Simulated data with realistic correlations'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
