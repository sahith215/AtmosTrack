// src/types/LiveReading.ts
export type LiveReading = {
  deviceId: string;
  timestamp: string;
  env: {
    temperature: number;
    humidity: number;
  };
  air: {
    co2ppm: number;
    aqi?: number;
  };
  location?: {
    lat: number;
    lng: number;
  };
};
