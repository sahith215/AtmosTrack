/**
 * test-anchor.js — Sends a fake sensor reading to the backend to trigger
 * the full blockchain anchoring pipeline:
 *   POST /api/sensor-data → SHA-256 → MongoDB → Polygon Amoy → txHash saved
 *
 * Run from the Backend folder:
 *   node scripts/test-anchor.js
 */

import fetch from 'node-fetch';

const BACKEND = 'http://localhost:5000';

const mockReading = {
  deviceId: 'ATMOSTRACK-01',
  sessionId: `test-session-${Date.now()}`,
  timestamp: new Date().toISOString(),
  location: { lat: 18.1124, lng: 83.3987, speed: 0, context: 'outdoor' },
  environment: { temperature: 28.5, humidity: 65.2 },
  imu: { ax: 100, ay: -50, az: 16000, gx: 10, gy: -5, gz: 3 },
  purification: { on: true },
  co2: { ppm: 420, status: 'GOOD', healthAdvice: 'Good indoor air quality' },
  mq135: { raw: 800, volt: 0.97 },
};

console.log('🧪 Sending test sensor reading to trigger blockchain anchoring...\n');

try {
  const res = await fetch(`${BACKEND}/api/sensor-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mockReading),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    console.error('❌ Backend rejected the reading:', json);
    process.exit(1);
  }

  console.log('✅ Reading accepted by backend!');
  console.log('⏳ Blockchain anchoring is happening in the background (~5-15 seconds)...');
  console.log('\nWatch the backend terminal — you should see:');
  console.log('   ✅ SAVED READING [...] hash=... anchorStatus=PENDING');
  console.log('   ⛓️  ANCHORED [...] txHash=0x...\n');
  console.log('Then open the Data Export page → click "Preview" to see the ⛓️ ANCHORED badge.');

} catch (err) {
  console.error('❌ Could not reach backend:', err.message);
  console.error('   Make sure "node server.js" is running in the Backend folder.');
}
