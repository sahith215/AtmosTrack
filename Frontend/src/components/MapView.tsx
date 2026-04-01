import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, Layers, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealtime } from '../contexts/RealtimeContext';

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

// Backend data shape
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
  isFallback?: boolean; // NEW: true when we’re just showing LIET because backend is offline
}

// LIET coords
const LIET_COORDS = { lat: 18.0953, lng: 83.4308 };

// Recenter helper
const RecenterOnLiveLocation: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (!lat || !lng) return;
    if (lat === 0 && lng === 0) return;
    map.setView([lat, lng], 17, { animate: true });
  }, [lat, lng, map]);

  return null;
};

// Heat layer
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
          fillOpacity: location.isFallback ? 0.15 : 0.3, // dimmer if just fallback
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

// Marker
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
        border: 3px solid ${
          location.isLive
            ? location.isFallback
              ? '#60a5fa'  // blue ring when fallback LIET
              : '#fbbf24' // yellow ring when true live node
            : 'white'
        };
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
                  📡 Real-time AtmosTrack node
                  {location.isFallback ? ' (LIET fallback while offline)' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

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

const MapView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('aqi');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  // ── Use the shared app-level WebSocket — NO separate socket created here ──
  const { latestReading, status } = useRealtime();
  const isOnline = status === 'connected';

  // Map the shared LiveReading type to the local SensorData shape
  const liveData: SensorData | null = latestReading
    ? {
        deviceId: latestReading.deviceId,
        environment: {
          temperature: (latestReading as any).environment?.temperature ?? null,
          humidity: (latestReading as any).environment?.humidity ?? null,
        },
        imu: {
          ax: (latestReading as any).imu?.ax ?? null,
          ay: (latestReading as any).imu?.ay ?? null,
          az: (latestReading as any).imu?.az ?? null,
          gx: (latestReading as any).imu?.gx ?? null,
          gy: (latestReading as any).imu?.gy ?? null,
          gz: (latestReading as any).imu?.gz ?? null,
        },
        location: {
          lat: (latestReading as any).location?.lat ?? null,
          lng: (latestReading as any).location?.lng ?? null,
          speed: (latestReading as any).location?.speed ?? null,
        },
        purification: { on: (latestReading as any).purification?.on ?? false },
        co2: (latestReading as any).co2 ?? null,
        mq135: {
          raw: (latestReading as any).mq135?.raw ?? null,
          volt: (latestReading as any).mq135?.volt ?? null,
        },
        timestamp: latestReading.timestamp,
      }
    : null;

  const filters = [
    { id: 'aqi', label: 'AQI', color: 'bg-orange-500' },
    { id: 'voc', label: 'VOC', color: 'bg-blue-500' },
    { id: 'co2', label: 'CO₂', color: 'bg-green-500' },
    { id: 'health', label: 'Health Score', color: 'bg-red-500' },
  ];

  const mqRaw = liveData?.mq135?.raw ?? null;
  const liveAQI = convertRawToAQI(mqRaw);
  const liveCO2 = getCO2FromData(liveData);
  const liveHealth = convertToHealthScore(liveAQI);

  const hasGpsFix =
    isOnline &&
    liveData?.location &&
    liveData.location.lat != null &&
    liveData.location.lng != null &&
    !(liveData.location.lat === 0 && liveData.location.lng === 0);

  // When backend OFFLINE → show LIET fallback
  // When backend ONLINE + GPS valid → show current node location
  const mainLocation: Location = {
    id: 1,
    name: hasGpsFix
      ? 'AtmosTrack Mobile Node (Current Location)'
      : 'LIET – Lendi Institute of Engineering & Technology',
    lat: hasGpsFix ? (liveData!.location.lat as number) : LIET_COORDS.lat,
    lng: hasGpsFix ? (liveData!.location.lng as number) : LIET_COORDS.lng,
    aqi: liveAQI,
    voc: mqRaw ? Math.floor(mqRaw / 10) : 0,
    co2: liveCO2,
    health: liveHealth,
    isLive: true,
    isFallback: !hasGpsFix, // only “fallback” when we literally have no GPS
  };

  const locations: Location[] = [mainLocation];

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

          {hasGpsFix && (
            <RecenterOnLiveLocation
              lat={liveData!.location.lat as number}
              lng={liveData!.location.lng as number}
            />
          )}

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
              !isOnline
                ? 'bg-red-100/80 text-red-700'
                : !latestReading || (Date.now() - new Date(latestReading.timestamp).getTime() > 60000)
                ? 'bg-amber-100/80 text-amber-700'
                : 'bg-green-100/80 text-green-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                !isOnline
                  ? 'bg-red-500'
                  : !latestReading || (Date.now() - new Date(latestReading.timestamp).getTime() > 60000)
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              } animate-pulse`}
            ></div>
            <span>
              {!isOnline
                ? 'Monitor: Offline (showing LIET)'
                : !latestReading || (Date.now() - new Date(latestReading.timestamp).getTime() > 60000)
                ? 'Monitor: Sensor Offline / Stale'
                : 'Monitor: Live (Active)'}
            </span>
          </div>
        </div>

        {/* Controls (zoom / reset / heatmap) */}
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
              showHeatMap
                ? 'bg-orange-500 text-white'
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>

        {/* Info panel (unchanged logic, but now reflects mainLocation) */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl max-w-sm z-[1000] border border-white/40">
            {/* ...keep your existing panel body... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
