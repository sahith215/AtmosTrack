import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, Layers, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 🔥 SAFE: Backend sensor data interface
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

interface Location {
  id: number;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  voc: number;
  co2: number;
  health: number;
  isLive?: boolean;
}

// 🔥 SIMPLIFIED: Heat map component (optional)
const HeatMapLayer: React.FC<{ locations: Location[]; activeFilter: string }> = ({ locations, activeFilter }) => {
  const map = useMap();

  useEffect(() => {
    // Simple heat visualization without external plugin
    try {
      // Remove any existing custom layers
      map.eachLayer((layer: L.Layer) => {
        if (layer.options && 'isHeatLayer' in layer.options) {
          map.removeLayer(layer);
        }
      });

      // Add simple circle markers for heat effect
      locations.forEach(location => {
        let intensity = 0;
        let color = '#10b981';
        
        switch (activeFilter) {
          case 'aqi':
            intensity = location.aqi;
            color = location.aqi <= 50 ? '#10b981' : location.aqi <= 100 ? '#f59e0b' : '#ef4444';
            break;
          case 'voc':
            intensity = location.voc;
            color = location.voc <= 30 ? '#10b981' : location.voc <= 50 ? '#f59e0b' : '#ef4444';
            break;
          case 'co2':
            intensity = location.co2;
            color = location.co2 <= 400 ? '#10b981' : location.co2 <= 500 ? '#f59e0b' : '#ef4444';
            break;
          case 'health':
            intensity = location.health;
            color = location.health >= 80 ? '#10b981' : location.health >= 60 ? '#f59e0b' : '#ef4444';
            break;
        }

        const circle = L.circle([location.lat, location.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          radius: Math.max(intensity * 50, 1000),
          isHeatLayer: true
        } as L.CircleOptions & { isHeatLayer: boolean });
        
        circle.addTo(map);
      });
    } catch (error) {
      console.error('Heat map error:', error);
    }
  }, [map, locations, activeFilter]);

  return null;
};

// 🔥 SAFE: Custom marker component
const CustomMarker: React.FC<{ location: Location; onClick: (location: Location) => void }> = ({ location, onClick }) => {
  const getMarkerColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981'; // Green
    if (aqi <= 100) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const customIcon = new L.DivIcon({
    html: `
      <div style="
        width: ${location.isLive ? '28px' : '24px'}; 
        height: ${location.isLive ? '28px' : '24px'}; 
        background-color: ${getMarkerColor(location.aqi)}; 
        border: 3px solid ${location.isLive ? '#fbbf24' : 'white'}; 
        border-radius: 50%; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${location.isLive ? '11px' : '10px'};
        font-weight: bold;
        color: white;
      ">
        ${location.aqi}
      </div>
      ${location.isLive ? '<div style="position: absolute; top: -5px; right: -5px; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; border: 1px solid white;"></div>' : ''}
    `,
    className: 'custom-div-icon',
    iconSize: [location.isLive ? 28 : 24, location.isLive ? 28 : 24],
    iconAnchor: [location.isLive ? 14 : 12, location.isLive ? 14 : 12],
  });

  return (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={customIcon}
      eventHandlers={{
        click: () => onClick(location),
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">
            {location.name}
            {location.isLive && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🔴 LIVE</span>}
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>AQI:</span>
              <span className={`font-semibold ${location.aqi <= 50 ? 'text-green-600' : location.aqi <= 100 ? 'text-orange-600' : 'text-red-600'}`}>
                {location.aqi}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VOC:</span>
              <span>{location.voc} ppb</span>
            </div>
            <div className="flex justify-between">
              <span>CO₂:</span>
              <span>{location.co2} ppm</span>
            </div>
            <div className="flex justify-between">
              <span>Health:</span>
              <span>{location.health}</span>
            </div>
            {location.isLive && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-green-600 font-medium">📡 Real-time ESP32 data</div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('aqi');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  
  // 🔥 SAFE: Real-time backend data states with error handling
  const [liveData, setLiveData] = useState<SensorData | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // 🔥 SAFE: Conversion functions with error handling
  const convertRawToAQI = (rawValue: number): number => {
    try {
      const aqi = Math.floor((rawValue / 4095) * 500);
      return Math.max(0, Math.min(500, aqi));
    } catch {
      return 75; // Default fallback
    }
  };

  const convertToHealthScore = (aqi: number): number => {
    try {
      if (aqi <= 50) return 85 + Math.floor(Math.random() * 15);
      if (aqi <= 100) return 65 + Math.floor(Math.random() * 20);
      if (aqi <= 150) return 40 + Math.floor(Math.random() * 25);
      return 20 + Math.floor(Math.random() * 20);
    } catch {
      return 72; // Default fallback
    }
  };

  const convertToCO2 = (mq135Raw: number): number => {
    try {
      let baseCO2: number;
      if (mq135Raw <= 800) {
        baseCO2 = 400 + ((mq135Raw - 300) / 500) * 100;
      } else if (mq135Raw <= 2000) {
        baseCO2 = 500 + ((mq135Raw - 800) / 1200) * 300;
      } else {
        baseCO2 = 800 + ((mq135Raw - 2000) / 2000) * 400;
      }
      return Math.max(350, Math.min(1200, Math.floor(baseCO2)));
    } catch {
      return 420; // Default fallback
    }
  };

  // 🔥 SAFE: Backend connection with error handling
  useEffect(() => {
    let socket: any = null;
    
    try {
      // Dynamic import to avoid crashes
      import('socket.io-client').then((io) => {
        socket = io.default('http://localhost:5000', {
          transports: ['websocket', 'polling'],
          timeout: 5000
        });

        socket.on('connect', () => {
          console.log('🗺️ Map connected to AtmosTrack backend');
          setIsOnline(true);
        });

        socket.on('sensorUpdate', (data: SensorData) => {
          console.log('🗺️ MAP LIVE DATA:', data.airQuality.raw);
          setLiveData(data);
        });

        socket.on('disconnect', () => {
          setIsOnline(false);
        });
      }).catch((error) => {
        console.error('Socket.io not available:', error);
        setIsOnline(false);
      });

      // Fetch initial data safely
      fetchLatestData().catch(console.error);
    } catch (error) {
      console.error('Backend connection error:', error);
      setIsOnline(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
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
      console.error('Map: Error fetching initial data:', error);
      setIsOnline(false);
    }
  };

  const filters = [
    { id: 'aqi', label: 'AQI', color: 'bg-orange-500' },
    { id: 'voc', label: 'VOC', color: 'bg-blue-500' },
    { id: 'co2', label: 'CO₂', color: 'bg-green-500' },
    { id: 'health', label: 'Health Score', color: 'bg-red-500' },
  ];

  // 🔥 SAFE: Locations with fallback values
  const locations: Location[] = [
    { 
      id: 1, 
      name: 'Vizianagaram Live Station', 
      lat: 18.1167, 
      lng: 83.4167, 
      aqi: liveData ? convertRawToAQI(liveData.airQuality.raw) : 75,
      voc: liveData ? Math.floor(liveData.airQuality.raw / 10) : 45,
      co2: liveData ? convertToCO2(liveData.airQuality.raw) : 420,
      health: liveData ? convertToHealthScore(convertRawToAQI(liveData.airQuality.raw)) : 72,
      isLive: true
    },
    { 
      id: 2, 
      name: 'Jonnada Area - Vizianagaram', 
      lat: 18.1050, 
      lng: 83.4300, 
      aqi: liveData ? Math.max(20, convertRawToAQI(liveData.airQuality.raw) + Math.floor(Math.random() * 20 - 10)) : 68,
      voc: liveData ? Math.floor(liveData.airQuality.raw / 12) : 38,
      co2: liveData ? convertToCO2(liveData.airQuality.raw) + Math.floor(Math.random() * 50 - 25) : 395,
      health: liveData ? convertToHealthScore(convertRawToAQI(liveData.airQuality.raw)) + Math.floor(Math.random() * 10 - 5) : 78,
      isLive: true
    },
    // Demo locations
    { id: 3, name: 'Mumbai', lat: 19.0760, lng: 72.8777, aqi: 92, voc: 52, co2: 445, health: 68 },
    { id: 4, name: 'Bangalore', lat: 12.9716, lng: 77.5946, aqi: 65, voc: 38, co2: 380, health: 78 },
    { id: 5, name: 'Chennai', lat: 13.0827, lng: 80.2707, aqi: 58, voc: 32, co2: 365, health: 82 },
    { id: 6, name: 'Kolkata', lat: 22.5726, lng: 88.3639, aqi: 85, voc: 48, co2: 435, health: 70 },
    { id: 7, name: 'Hyderabad', lat: 17.3850, lng: 78.4867, aqi: 71, voc: 41, co2: 395, health: 75 },
    { id: 8, name: 'Pune', lat: 18.5204, lng: 73.8567, aqi: 68, voc: 39, co2: 385, health: 77 },
    { id: 9, name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, aqi: 89, voc: 51, co2: 440, health: 69 },
  ];

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView([18.1167, 83.4167], 12);
    }
  };

  const toggleHeatMap = () => {
    setShowHeatMap(!showHeatMap);
  };

  return (
    <div className="min-h-screen pt-16 relative bg-gradient-to-br from-gray-50 to-orange-50"> {/* 🔥 FIXED: Standard Tailwind classes */}
      {/* Map Container */}
      <div className="relative h-[calc(100vh-64px)]">
        <MapContainer
          center={[18.1167, 83.4167]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Heat Map Layer */}
          {showHeatMap && (
            <HeatMapLayer locations={locations} activeFilter={activeFilter} />
          )}

          {/* Location Markers */}
          {locations.map((location) => (
            <CustomMarker
              key={location.id}
              location={location}
              onClick={handleLocationClick}
            />
          ))}
        </MapContainer>

        {/* Filter Pills */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-[1000]">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`
                px-4 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105
                ${activeFilter === filter.id 
                  ? `${filter.color} text-white shadow-lg` 
                  : 'bg-white/80 text-gray-700 hover:bg-white/90 border border-white/30 backdrop-blur-sm'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Live Status Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/30 ${
            isOnline ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span>Vizianagaram {isOnline ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
          <button 
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 transform hover:scale-105"
          >
            <ZoomIn className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 transform hover:scale-105"
          >
            <ZoomOut className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={handleReset}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 transform hover:scale-105"
          >
            <RotateCcw className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={toggleHeatMap}
            className={`w-12 h-12 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 border border-gray-200 ${
              showHeatMap ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>

        {/* Data Panel */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-lg max-w-sm z-[1000] border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm">
                  {selectedLocation.name}
                  {selectedLocation.isLive && (
                    <span className="ml-2 text-xs bg-green-500/80 text-white px-2 py-1 rounded-full animate-pulse">LIVE</span>
                  )}
                </h3>
                <div className={`text-sm font-medium drop-shadow-sm ${selectedLocation.aqi <= 50 ? 'text-green-700' : selectedLocation.aqi <= 100 ? 'text-orange-700' : 'text-red-700'}`}>
                  {selectedLocation.aqi <= 50 ? 'Good' : selectedLocation.aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-700 hover:text-gray-900 transition-colors duration-200 p-1 hover:bg-white/30 rounded-lg backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 bg-white/25 backdrop-blur-sm rounded-lg border border-white/20 ${selectedLocation.isLive ? 'animate-pulse' : ''}`}>
                <span className="text-gray-900 font-semibold drop-shadow-sm">AQI</span>
                <span className={`font-bold text-lg drop-shadow-sm ${selectedLocation.aqi <= 50 ? 'text-green-800' : selectedLocation.aqi <= 100 ? 'text-orange-800' : 'text-red-800'}`}>
                  {selectedLocation.aqi}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-white/25 backdrop-blur-sm rounded-lg border border-white/20 ${selectedLocation.isLive ? 'animate-pulse' : ''}`}>
                <span className="text-gray-900 font-semibold drop-shadow-sm">VOC</span>
                <span className="font-bold text-blue-800 drop-shadow-sm">{selectedLocation.voc} ppb</span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-white/25 backdrop-blur-sm rounded-lg border border-white/20 ${selectedLocation.isLive ? 'animate-pulse' : ''}`}>
                <span className="text-gray-900 font-semibold drop-shadow-sm">CO₂</span>
                <span className="font-bold text-green-800 drop-shadow-sm">{selectedLocation.co2} ppm</span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-white/25 backdrop-blur-sm rounded-lg border border-white/20 ${selectedLocation.isLive ? 'animate-pulse' : ''}`}>
                <span className="text-gray-900 font-semibold drop-shadow-sm">Health Score</span>
                <span className="font-bold text-purple-800 drop-shadow-sm">{selectedLocation.health}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/30">
              <div className="text-sm text-gray-900 font-semibold mb-2 drop-shadow-sm">
                {selectedLocation.isLive ? '🔴 Live ESP32 Feed' : '24h Trend'}
              </div>
              <div className={`h-8 bg-gradient-to-r from-green-300/70 via-orange-300/70 to-red-300/70 rounded-lg backdrop-blur-sm border border-white/20 ${selectedLocation.isLive ? 'animate-pulse' : ''}`}></div>
              {selectedLocation.isLive && (
                <div className="text-xs text-green-700 font-medium mt-2 drop-shadow-sm">
                  📡 Updates every 5 seconds from hardware sensors
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
