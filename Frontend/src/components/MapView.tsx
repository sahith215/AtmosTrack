import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, Layers, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ Backend data shape (new multi‑sensor)
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

// LIET coordinates – replace with exact from Google Maps if needed
const LIET_COORDS = { lat: 18.0953, lng: 83.4308 };

// Heat map layer (visuals unchanged)
const HeatMapLayer: React.FC<{ locations: Location[]; activeFilter: string }> = ({
  locations,
  activeFilter,
}) => {
  const map = useMap();

  useEffect(() => {
    try {
      map.eachLayer((layer: L.Layer & { options?: any }) => {
        if (layer.options && layer.options.isHeatLayer) {
          map.removeLayer(layer);
        }
      });

      locations.forEach((location) => {
        let intensity = 0;
        let color = '#10b981';

        switch (activeFilter) {
          case 'aqi':
            intensity = location.aqi;
            color =
              location.aqi <= 50
                ? '#10b981'
                : location.aqi <= 100
                ? '#f59e0b'
                : '#ef4444';
            break;
          case 'voc':
            intensity = location.voc;
            color =
              location.voc <= 30
                ? '#10b981'
                : location.voc <= 50
                ? '#f59e0b'
                : '#ef4444';
            break;
          case 'co2':
            intensity = location.co2;
            color =
              location.co2 <= 400
                ? '#10b981'
                : location.co2 <= 700
                ? '#f59e0b'
                : '#ef4444';
            break;
          case 'health':
            intensity = location.health;
            color =
              location.health >= 80
                ? '#10b981'
                : location.health >= 60
                ? '#f59e0b'
                : '#ef4444';
            break;
        }

        const circle = L.circle([location.lat, location.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.3,
          radius: Math.max(intensity * 50, 800),
          isHeatLayer: true,
        } as L.CircleOptions & { isHeatLayer: boolean });

        circle.addTo(map);
      });
    } catch (error) {
      console.error('Heat map error:', error);
    }
  }, [map, locations, activeFilter]);

  return null;
};

// Custom marker (looks same, but only LIET now)
const CustomMarker: React.FC<{ location: Location; onClick: (l: Location) => void }> = ({
  location,
  onClick,
}) => {
  const getMarkerColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#f59e0b';
    return '#ef4444';
  };

  const customIcon = new L.DivIcon({
    html: `
      <div style="
        width: ${location.isLive ? '30px' : '26px'};
        height: ${location.isLive ? '30px' : '26px'};
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
        ${Math.round(location.aqi)}
      </div>
      ${
        location.isLive
          ? '<div style="position: absolute; top: -6px; right: -6px; width: 9px; height: 9px; background: #22c55e; border-radius: 50%; border: 1px solid white;"></div>'
          : ''
      }
    `,
    className: 'custom-div-icon',
    iconSize: [location.isLive ? 30 : 26, location.isLive ? 30 : 26],
    iconAnchor: [location.isLive ? 15 : 13, location.isLive ? 15 : 13],
  });

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={customIcon}
      eventHandlers={{ click: () => onClick(location) }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">
            {location.name}
            {location.isLive && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                🔴 LIVE
              </span>
            )}
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>AQI:</span>
              <span
                className={`font-semibold ${
                  location.aqi <= 50
                    ? 'text-green-600'
                    : location.aqi <= 100
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}
              >
                {Math.round(location.aqi)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VOC:</span>
              <span>{location.voc} ppb</span>
            </div>
            <div className="flex justify-between">
              <span>CO₂:</span>
              <span>{Math.round(location.co2)} ppm</span>
            </div>
            <div className="flex justify-between">
              <span>Health:</span>
              <span>{Math.round(location.health)}</span>
            </div>
            {location.isLive && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-green-600 font-medium">
                  📡 Real-time LIET AtmosTrack node
                </div>
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

  const [liveData, setLiveData] = useState<SensorData | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const convertRawToAQI = (rawValue: number | null): number => {
    if (!rawValue && rawValue !== 0) return 75;
    const aqi = Math.floor((rawValue / 4095) * 500);
    return Math.max(0, Math.min(500, aqi));
  };

  const convertToHealthScore = (aqi: number): number => {
    if (aqi <= 50) return 90;
    if (aqi <= 100) return 75;
    if (aqi <= 150) return 60;
    return 45;
  };

  const getCO2FromData = (data: SensorData | null): number => {
    if (!data || !data.co2) return 420;
    return Math.round(data.co2.ppm);
  };

  // Backend connection (same URL as dashboard)
  useEffect(() => {
    // Using global io injected by socket.io‑client via bundler
    const socket =
      (window as any).io &&
      (window as any).io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });

    if (socket) {
      socket.on('connect', () => {
        console.log('🗺️ Map connected to backend');
        setIsOnline(true);
      });

      socket.on('sensorUpdate', (data: SensorData) => {
        setLiveData(data);
      });

      socket.on('disconnect', () => setIsOnline(false));
    }

    const fetchLatestData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/latest');
        const json = await res.json();
        if (json.success && json.data) {
          setLiveData(json.data);
          setIsOnline(json.isOnline);
        }
      } catch (e) {
        console.error('Map: error fetching latest', e);
        setIsOnline(false);
      }
    };

    fetchLatestData();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const filters = [
    { id: 'aqi', label: 'AQI', color: 'bg-orange-500' },
    { id: 'voc', label: 'VOC', color: 'bg-blue-500' },
    { id: 'co2', label: 'CO₂', color: 'bg-green-500' },
    { id: 'health', label: 'Health Score', color: 'bg-red-500' },
  ];

  // Only LIET location, driven by live data
  const mqRaw = liveData?.mq135?.raw ?? null;
  const liveAQI = convertRawToAQI(mqRaw);
  const liveCO2 = getCO2FromData(liveData);
  const liveHealth = convertToHealthScore(liveAQI);

  const lietLocation: Location = {
    id: 1,
    name: 'LIET – Lendi Institute of Engineering & Technology',
    lat: liveData?.location.lat ?? LIET_COORDS.lat,
    lng: liveData?.location.lng ?? LIET_COORDS.lng,
    aqi: liveAQI,
    voc: mqRaw ? Math.floor(mqRaw / 10) : 0,
    co2: liveCO2,
    health: liveHealth,
    isLive: true,
  };

  const locations: Location[] = [lietLocation];

  const handleLocationClick = (location: Location) => setSelectedLocation(location);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () =>
    mapRef.current?.setView([LIET_COORDS.lat, LIET_COORDS.lng], 15);
  const toggleHeatMap = () => setShowHeatMap(!showHeatMap);

  return (
    <div className="min-h-screen pt-16 relative bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="relative h-[calc(100vh-64px)]">
        <MapContainer
          center={[LIET_COORDS.lat, LIET_COORDS.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHeatMap && (
            <HeatMapLayer locations={locations} activeFilter={activeFilter} />
          )}

          {locations.map((location) => (
            <CustomMarker
              key={location.id}
              location={location}
              onClick={handleLocationClick}
            />
          ))}
        </MapContainer>

        {/* Filter pills */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-[1000]">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`
                px-4 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105
                ${
                  activeFilter === filter.id
                    ? `${filter.color} text-white shadow-lg`
                    : 'bg-white/80 text-gray-700 hover:bg-white/90 border border-white/30 backdrop-blur-sm'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Online / Offline pill */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/30 ${
              isOnline ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            ></div>
            <span>LIET Monitor: {isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Controls */}
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

        {/* LIET info panel */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl max-w-sm z-[1000] border border-white/40">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {selectedLocation.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Jonnada (V), Denkada (M), Vizag–Vizianagaram Road, AP – 535005
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedLocation.aqi <= 50
                        ? 'bg-green-100 text-green-700'
                        : selectedLocation.aqi <= 100
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedLocation.aqi <= 50
                      ? 'Good Air'
                      : selectedLocation.aqi <= 100
                      ? 'Moderate'
                      : 'Unhealthy'}
                  </span>
                  {selectedLocation.isLive && (
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-100">
                <div className="text-xs text-gray-500">AQI</div>
                <div className="text-lg font-bold text-emerald-700">
                  {Math.round(selectedLocation.aqi)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-100">
                <div className="text-xs text-gray-500">CO₂</div>
                <div className="text-lg font-bold text-sky-700">
                  {Math.round(selectedLocation.co2)} ppm
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 border border-amber-100">
                <div className="text-xs text-gray-500">VOC (MQ135)</div>
                <div className="text-lg font-bold text-amber-700">
                  {selectedLocation.voc} ppb
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-100 border border-fuchsia-100">
                <div className="text-xs text-gray-500">Health Score</div>
                <div className="text-lg font-bold text-fuchsia-700">
                  {Math.round(selectedLocation.health)}
                </div>
              </div>
            </div>

            {liveData?.environment && (
              <div className="mb-2 text-xs text-gray-600">
                🌡️ {liveData.environment.temperature}°C •{' '}
                {liveData.environment.humidity}% RH
              </div>
            )}

            <div className="mt-1 text-xs text-gray-500">
              📡 Updates every 5s from LIET rooftop AtmosTrack node.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
