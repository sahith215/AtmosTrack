const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// ✅ CORS for Vite (port 5173)
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ CORS middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(express.json());

// Store sensor data in memory
let latestSensorData = null;
let sensorHistory = [];

// 🔹 AI feature window (rolling last N readings)
const WINDOW_SIZE = 12; // ~60s if ESP32 sends every 5s
let aiWindow = [];

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: '🌍 AtmosTrack Multi-Sensor Backend Running!',
    version: '3.1.0 - Full Sensor Suite',
    sensors: [
      'DHT11 (Temp/Humidity)',
      'MG811 (CO2)',
      'MQ135 (Air Quality)',
      'MPU6050 (IMU)',
      'GPS',
    ],
    endpoints: {
      sensorData: '/api/sensor-data',
      latest: '/api/latest',
      health: '/api/health',
    },
  });
});

// 🔧 ESP32 sends full sensor suite here
app.post('/api/sensor-data', (req, res) => {
  const {
    deviceId = 'ATMOSTRACK-01',
    environment = {},
    imu = {},
    location = {},
    purification = {},
    co2Level = null, // MG811
    mq135 = {}, // MQ135 raw + volt
  } = req.body;

  // 🆕 Process CO2 data (MG811) if available
  const processedCO2 =
    co2Level !== null
      ? {
          ppm: parseFloat(Number(co2Level).toFixed(1)),
          status: getCO2Status(Number(co2Level)),
          healthAdvice: getCO2HealthAdvice(Number(co2Level)),
        }
      : null;

  const sensorReading = {
    deviceId,
    environment: {
      temperature: environment.temperature ?? null,
      humidity: environment.humidity ?? null,
    },
    imu: {
      ax: imu.ax ?? null,
      ay: imu.ay ?? null,
      az: imu.az ?? null,
      gx: imu.gx ?? null,
      gy: imu.gy ?? null,
      gz: imu.gz ?? null,
    },
    location: {
      lat: location.lat ?? null,
      lng: location.lng ?? null,
      speed: location.speed ?? null,
    },
    purification: {
      on: purification.on ?? false,
    },
    co2: processedCO2, // MG811
    mq135: {
      raw: mq135.raw ?? null,
      volt: mq135.volt ?? null,
    },
    timestamp: new Date().toISOString(),
  };

  // 🔹 Maintain rolling window for AI
  aiWindow.push(sensorReading);
  if (aiWindow.length > WINDOW_SIZE) {
    aiWindow = aiWindow.slice(-WINDOW_SIZE);
  }

  // 🔹 Example AI features from window (CO2_avg, CO2_std, Hour)
  let CO2_avg = null;
  let CO2_std = null;

  const co2Values = aiWindow
    .map((r) => (r.co2 && typeof r.co2.ppm === 'number' ? r.co2.ppm : null))
    .filter((v) => v !== null);

  if (co2Values.length > 0) {
    const mean = co2Values.reduce((a, b) => a + b, 0) / co2Values.length;
    const variance =
      co2Values
        .map((v) => (v - mean) ** 2)
        .reduce((a, b) => a + b, 0) / co2Values.length;
    CO2_avg = mean;
    CO2_std = Math.sqrt(variance);
  }

  const now = new Date();
  const Hour = now.getHours();

  // 🔹 Build full AI features
  const VOC_values = aiWindow
    .map((r) =>
      r.mq135 && typeof r.mq135.raw === 'number' ? r.mq135.raw : null
    )
    .filter((v) => v !== null);

  let VOC_avg = null;
  let VOC_std = null;
  if (VOC_values.length > 0) {
    const meanVOC = VOC_values.reduce((a, b) => a + b, 0) / VOC_values.length;
    const varianceVOC =
      VOC_values.map((v) => (v - meanVOC) ** 2).reduce((a, b) => a + b, 0) /
      VOC_values.length;
    VOC_avg = meanVOC;
    VOC_std = Math.sqrt(varianceVOC);
  }

  // Simple vibration amplitude from IMU
  const vibValues = aiWindow
    .map((r) =>
      r.imu && r.imu.ax !== null && r.imu.ay !== null && r.imu.az !== null
        ? (Math.abs(r.imu.ax) + Math.abs(r.imu.ay) + Math.abs(r.imu.az)) / 3
        : null
    )
    .filter((v) => v !== null);

  let Vibration_amp = null;
  let Vibration_freq = null;
  if (vibValues.length > 0) {
    Vibration_amp = vibValues.reduce((a, b) => a + b, 0) / vibValues.length;
    // crude frequency proxy: count of “high vib” readings in window
    const threshold = 15000; // tune based on your IMU range
    Vibration_freq = aiWindow.filter((r) => {
      const ax = r.imu.ax ?? 0;
      const ay = r.imu.ay ?? 0;
      const az = r.imu.az ?? 0;
      return (
        Math.abs(ax) > threshold ||
        Math.abs(ay) > threshold ||
        Math.abs(az) > threshold
      );
    }).length;
  }

  sensorReading.aiFeatures = {
    VOC_avg,
    VOC_std,
    CO2_avg,
    CO2_std,
    Vibration_amp,
    Vibration_freq,
    Hour,
  };

  // Store data
  latestSensorData = sensorReading;
  sensorHistory.push(sensorReading);

  // Keep only last 100 readings
  if (sensorHistory.length > 100) {
    sensorHistory = sensorHistory.slice(-100);
  }

  // Real-time update to frontend (baseline reading)
  io.emit('sensorUpdate', sensorReading);

  // 🔹 Call Python AI server (non‑blocking)
  if (
    VOC_avg !== null &&
    CO2_avg !== null &&
    Vibration_amp !== null &&
    Vibration_freq !== null
  ) {
    axios
      .post('http://localhost:8000/classify', {
        VOC_avg,
        VOC_std: VOC_std || 0,
        CO2_avg,
        CO2_std: CO2_std || 0,
        Vibration_amp,
        Vibration_freq,
        Hour,
      })
      .then((response) => {
        sensorReading.sourceClassification = response.data;
        latestSensorData = sensorReading;
        io.emit('sensorUpdate', sensorReading);
      })
      .catch((err) => {
        console.error('AI server error:', err.message);
      });
  }

  // Logging (DHT + MG811 + MQ135 + MPU + GPS)
  const co2Message = processedCO2
    ? ` | CO2: ${processedCO2.ppm} ppm (${processedCO2.status})`
    : '';

  const mqMessage =
    sensorReading.mq135 && sensorReading.mq135.raw !== null
      ? ` | MQ135: raw=${sensorReading.mq135.raw} V=${sensorReading.mq135.volt}`
      : '';

  const imuMessage =
    sensorReading.imu && sensorReading.imu.ax !== null
      ? ` | MPU: ax=${sensorReading.imu.ax} ay=${sensorReading.imu.ay} az=${sensorReading.imu.az}`
      : '';

  console.log(
    `📊 Env T=${sensorReading.environment.temperature}°C ` +
      `H=${sensorReading.environment.humidity}%${co2Message}${mqMessage}${imuMessage} | ` +
      `GPS=(${sensorReading.location.lat},${sensorReading.location.lng}) ` +
      `v=${sensorReading.location.speed}km/h | ` +
      `PUR=${sensorReading.purification.on ? 'ON' : 'OFF'}`
  );

  res.json({ success: true, data: sensorReading });
});

// Frontend gets latest data
app.get('/api/latest', (req, res) => {
  res.json({
    success: true,
    data: latestSensorData,
    isOnline: latestSensorData
      ? Date.now() - new Date(latestSensorData.timestamp).getTime() < 30000
      : false,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AtmosTrack Multi-Sensor Backend',
    version: '3.1.0',
    sensors: ['DHT11', 'MG811', 'MQ135', 'MPU6050', 'GPS'],
    dataPoints: sensorHistory.length,
    lastReading: latestSensorData ? latestSensorData.timestamp : null,
  });
});

// WebSocket connection logging
io.on('connection', (socket) => {
  console.log('🔌 Frontend connected from:', socket.handshake.address);

  if (latestSensorData) {
    socket.emit('sensorUpdate', latestSensorData);
    console.log('📤 Sent latest multi-sensor data to new connection');
  }

  socket.on('disconnect', () => {
    console.log('❌ Frontend disconnected');
  });
});

// CO2 Helper Functions (for MG811)
function getCO2Status(ppm) {
  if (ppm < 400) return 'OUTDOOR_FRESH';
  if (ppm < 1000) return 'GOOD';
  if (ppm < 2000) return 'STUFFY';
  if (ppm < 5000) return 'POOR';
  return 'DANGEROUS';
}

function getCO2HealthAdvice(ppm) {
  if (ppm < 400) return 'Outdoor fresh air quality';
  if (ppm < 1000) return 'Good indoor air quality';
  if (ppm < 2000) return 'Acceptable but may cause drowsiness';
  if (ppm < 5000) return 'Poor air quality - increase ventilation';
  return 'Dangerous levels - evacuate immediately';
}

// Server listen (ESP32 needs 0.0.0.0)
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 AtmosTrack Multi-Sensor Backend running on http://0.0.0.0:${PORT}`
  );
  console.log('🔗 Accepting connections from Vite frontend on port 5173');
  console.log('📡 WebSocket CORS enabled for localhost:5173');
  console.log('🌍 Sensors: DHT11 + MG811 + MQ135 + MPU6050 + GPS');
  console.log('📊 API Endpoints:');
  console.log('   POST /api/sensor-data - ESP32 data input');
  console.log('   GET  /api/latest      - Latest readings');
  console.log('   GET  /api/health      - System health');
});
