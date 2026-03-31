// src/types/LiveReading.ts
export type LiveReading = {
  deviceId: string;
  timestamp: string;

  // DHT11 temperature + humidity
  environment?: {
    temperature: number;
    humidity: number;
  };

  // Backwards compat alias used in some places
  env?: {
    temperature: number;
    humidity: number;
  };

  // MG811 CO2
  co2?: {
    ppm: number;
    status: string;
    healthAdvice: string;
  };

  // MQ135 Air quality
  mq135?: {
    raw: number | null;
    volt: number | null;
  };

  // Legacy air field (used in history)
  air?: {
    co2ppm: number;
    aqi?: number;
  };

  // MPU6050 IMU
  imu?: {
    ax: number | null;
    ay: number | null;
    az: number | null;
    gx: number | null;
    gy: number | null;
    gz: number | null;
  };

  // GPS
  location?: {
    lat: number;
    lng: number;
    speed?: number;
  };

  // Purification
  purification?: {
    on: boolean;
  };
};
