const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Updated CORS for Vite (port 5173)
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],  // Changed from 3000 to 5173
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ Updated CORS middleware for Vite
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],  // Changed from 3000 to 5173
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

// Store sensor data in memory (simple approach)
let latestSensorData = null;
let sensorHistory = [];

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🌍 AtmosTrack Dual Sensor Backend Running!',
    version: '2.0.0 - Dual Sensor Support',
    sensors: ['MQ135 (Air Quality)', 'MG811 (CO2)'],
    endpoints: {
      sensorData: '/api/sensor-data',
      latest: '/api/latest',
      health: '/api/health'
    }
  });
});

// 🔧 UPDATED: ESP32 sends dual sensor data here
app.post('/api/sensor-data', (req, res) => {
  const { 
    airQuality, 
    co2Level = null, 
    deviceId = 'atmostrack_dual_001', 
    location = 'Visakhapatnam',
    sensorTypes = ['MQ135']
  } = req.body;
  
  // Process air quality data (MQ135)
  const processedAirQuality = {
    raw: airQuality,
    voltage: (airQuality * 3.3 / 4095).toFixed(3),
    status: getAirQualityStatus(airQuality),
    healthAdvice: getHealthAdvice(airQuality)
  };

  // 🆕 Process CO2 data (MG811) if available
  const processedCO2 = co2Level ? {
    ppm: parseFloat(co2Level.toFixed(1)),
    status: getCO2Status(co2Level),
    healthAdvice: getCO2HealthAdvice(co2Level)
  } : null;

  const sensorReading = {
    deviceId,
    location,
    airQuality: processedAirQuality,
    co2: processedCO2,  // 🆕 Added CO2 data
    sensorTypes,        // 🆕 Added sensor types
    timestamp: new Date().toISOString()
  };

  // Store data
  latestSensorData = sensorReading;
  sensorHistory.push(sensorReading);
  
  // Keep only last 100 readings
  if (sensorHistory.length > 100) {
    sensorHistory = sensorHistory.slice(-100);
  }

  // Send real-time update to frontend
  io.emit('sensorUpdate', sensorReading);

  // 🔧 Enhanced logging for dual sensors
  const logMessage = `📊 Dual sensor data: ${processedAirQuality.status} (${airQuality})`;
  const co2Message = co2Level ? ` | CO2: ${co2Level.toFixed(0)} ppm (${getCO2Status(co2Level)})` : '';
  console.log(logMessage + co2Message);

  res.json({ success: true, data: sensorReading });
});

// Frontend gets latest data
app.get('/api/latest', (req, res) => {
  res.json({
    success: true,
    data: latestSensorData,
    isOnline: latestSensorData ? (Date.now() - new Date(latestSensorData.timestamp).getTime()) < 30000 : false
  });
});

// 🆕 Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AtmosTrack Dual Sensor Backend',
    version: '2.0.0',
    sensors: ['MQ135', 'MG811'],
    dataPoints: sensorHistory.length,
    lastReading: latestSensorData ? latestSensorData.timestamp : null
  });
});

// ✅ Enhanced WebSocket connection logging
io.on('connection', (socket) => {
  console.log('🔌 Frontend connected from:', socket.handshake.address);
  
  // Send latest data immediately when frontend connects
  if (latestSensorData) {
    socket.emit('sensorUpdate', latestSensorData);
    console.log('📤 Sent latest dual sensor data to new connection');
  }
  
  socket.on('disconnect', () => {
    console.log('❌ Frontend disconnected');
  });
});

// 🔧 Existing Air Quality Helper Functions
function getAirQualityStatus(value) {
  if (value < 300) return 'EXCELLENT';
  if (value < 600) return 'GOOD';
  if (value < 900) return 'MODERATE';
  if (value < 1200) return 'POOR';
  if (value < 1500) return 'UNHEALTHY';
  return 'HAZARDOUS';
}

function getHealthAdvice(value) {
  if (value < 300) return 'Perfect for outdoor activities';
  if (value < 600) return 'Safe for all groups';
  if (value < 900) return 'Sensitive groups should limit outdoor activities';
  if (value < 1200) return 'Everyone should reduce outdoor activities';
  if (value < 1500) return 'Avoid outdoor activities';
  return 'EMERGENCY: Stay indoors, close windows';
}

// 🆕 CO2 Helper Functions (for MG811)
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
  return 'Dangerous levels - evacuate and ventilate immediately';
}

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 AtmosTrack Dual Sensor Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Accepting connections from Vite frontend on port 5173`);
  console.log(`📡 WebSocket CORS enabled for localhost:5173`);
  console.log(`🌍 Sensors: MQ135 (Air Quality) + MG811 (CO2)`);
  console.log(`📊 API Endpoints:`);
  console.log(`   POST /api/sensor-data - ESP32 data input`);
  console.log(`   GET  /api/latest      - Latest readings`);
  console.log(`   GET  /api/health      - System health`);
});
