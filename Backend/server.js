import 'dotenv/config';
import { connectDB } from './db.js';

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Reading } from './models/Reading.js';
import { ExportRecipe } from './models/ExportRecipe.js';

console.log('PUBLIC_BASE_URL =>', process.env.PUBLIC_BASE_URL);

connectDB();

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);

app.use(express.json());

let latestSensorData = null;
let sensorHistory = [];

const WINDOW_SIZE = 12;
let aiWindow = [];

// ------------ CreditBatch model ------------
const creditBatchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true },
  deviceId: { type: String, required: true },
  fromTs: { type: Date, required: true },
  toTs: { type: Date, required: true },
  date: { type: String, required: true },
  dhiHours: { type: Number, required: true },
  tokens: { type: Number, required: true },
  aqiThreshold: { type: Number, default: 150 },
  status: { type: String, enum: ['PENDING', 'MINTED'], default: 'PENDING' },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const CreditBatch =
  mongoose.models.CreditBatch || mongoose.model('CreditBatch', creditBatchSchema);

// ------------ ExportSubscription model ------------
const exportSubscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    exports: {
      co2Digest: { type: Boolean, default: true },
      emissionsLedger: { type: Boolean, default: false },
      sourceDebug: { type: Boolean, default: false },
    },
    runUrl: { type: String, required: true },
  },
  { timestamps: true },
);

const ExportSubscription =
  mongoose.models.ExportSubscription ||
  mongoose.model('ExportSubscription', exportSubscriptionSchema);

// ------------ Helpers ------------
function adjustSourceClassification(sensorReading, modelResult) {
  if (!modelResult || !sensorReading.co2 || !sensorReading.aiFeatures) {
    return modelResult;
  }

  const status = sensorReading.co2.status;
  const co2 = sensorReading.co2.ppm;

  const aqiIsGood = status === 'OUTDOOR_FRESH' || status === 'GOOD';
  const co2IsLow = co2 < 450;
  const vibAmp = sensorReading.aiFeatures.Vibration_amp;
  const vibIsLow = vibAmp !== null && vibAmp < 3000;

  if (aqiIsGood && co2IsLow && vibIsLow && modelResult.confidence < 70) {
    return {
      label: 'Clean',
      confidence: 100,
      modelAccuracy: modelResult.modelAccuracy,
    };
  }

  return modelResult;
}

// helper for dynamic field paths like "air.co2ppm"
function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

// ------------ Root ------------
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
      exportReadings: '/api/exports/readings',
      exportReadingsCsv: '/api/exports/readings/csv',
      exportRecipe: '/api/exports/recipe',
      runRecipe: '/api/exports/recipe/:id/run',
      creditBatch: '/api/carbon/credit-batch',
      listBatches: '/api/carbon/batches',
      setLocationFromPhone: '/api/nodes/set-location',
    },
  });
});

// ------------ Export helpers ------------
function buildExportFilter(query) {
  const { from, to, deviceId, context = 'all' } = query;

  if (!from || !to) {
    return {
      error: 'from and to query parameters are required (ISO timestamps)',
    };
  }

  const fromDate = new Date(String(from));
  const toDate = new Date(String(to));

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { error: 'from and to must be valid ISO date strings' };
  }

  const filter = {
    timestamp: { $gte: fromDate, $lte: toDate },
  };

  if (deviceId) {
    filter.deviceId = String(deviceId);
  }

  if (context === 'indoor') {
    filter['location.context'] = 'indoor';
  } else if (context === 'outdoor') {
    filter['location.context'] = 'outdoor';
  }

  return { filter };
}

// ------------ Export endpoints (preview + CSV) ------------
app.get('/api/exports/readings', async (req, res) => {
  try {
    const { filter, error } = buildExportFilter(req.query);
    if (error) {
      return res.status(400).json({
        ok: false,
        error,
        example:
          '/api/exports/readings?from=2025-12-30T00:00:00.000Z&to=2025-12-31T00:00:00.000Z',
      });
    }

    const count = await Reading.countDocuments(filter);
    const sample = await Reading.find(filter)
      .sort({ timestamp: -1 })
      .limit(3)
      .lean();

    console.log('🔍 Export filter:', JSON.stringify(filter));
    console.log('🔍 Export count:', count);

    return res.json({
      ok: true,
      filter,
      totalMatches: count,
      previewSample: sample,
    });
  } catch (err) {
    console.error('Error in /api/exports/readings:', err);
    return res.status(500).json({ ok: false, error: 'Internal export error' });
  }
});

app.get('/api/exports/readings/csv', async (req, res) => {
  try {
    const { filter, error } = buildExportFilter(req.query);
    if (error) {
      return res.status(400).send(error);
    }

    const cursor = Reading.find(filter).sort({ timestamp: 1 }).cursor();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="atmostrack-readings.csv"',
    );

    const header =
      [
        'timestamp',
        'deviceId',
        'sessionId',
        'context',
        'lat',
        'lng',
        'altitude',
        'speed',
        'temperature',
        'humidity',
        'aqi',
        'co2ppm',
        'mq135Raw',
        'mq135Volt',
        'ai_vocAvg',
        'ai_vocStd',
        'ai_co2Avg',
        'ai_co2Std',
        'ai_vibrationAmp',
        'ai_vibrationFreq',
        'ai_hour',
        'src_label',
        'src_confidence',
        'em_co2eqKg',
        'em_method',
        'meta_firmwareVersion',
        'meta_gridRegion',
      ].join(',') + '\n';

    res.write(header);

    cursor.on('data', (doc) => {
      const ts = doc.timestamp ? new Date(doc.timestamp).toISOString() : '';
      const deviceId = doc.deviceId ?? '';
      const sessionId = doc.sessionId ?? '';

      const context = doc.location?.context ?? '';
      const lat = doc.location?.lat ?? '';
      const lng = doc.location?.lng ?? '';
      const altitude = doc.location?.altitude ?? '';
      const speed = doc.location?.speed ?? '';

      const temp = doc.environment?.temperature ?? '';
      const hum = doc.environment?.humidity ?? '';

      const aqi = doc.air?.aqi ?? '';
      const co2ppm = doc.air?.co2ppm ?? '';
      const mq135Raw = doc.air?.mq135Raw ?? '';
      const mq135Volt = doc.air?.mq135Volt ?? '';

      const vocAvg = doc.aiFeatures?.vocAvg ?? '';
      const vocStd = doc.aiFeatures?.vocStd ?? '';
      const co2Avg = doc.aiFeatures?.co2Avg ?? '';
      const co2Std = doc.aiFeatures?.co2Std ?? '';
      const vibAmp = doc.aiFeatures?.vibrationAmp ?? '';
      const vibFreq = doc.aiFeatures?.vibrationFreq ?? '';
      const hour = doc.aiFeatures?.Hour ?? '';

      const srcLabel = doc.sourceClassification?.label ?? '';
      const srcConf = doc.sourceClassification?.confidence ?? '';

      const co2eq = doc.emissions?.estimatedCO2eqKg ?? '';
      const emMethod = doc.emissions?.method ?? '';

      const fw = doc.meta?.firmwareVersion ?? '';
      const grid = doc.meta?.gridRegion ?? '';

      const row = [
        ts,
        deviceId,
        sessionId,
        context,
        lat,
        lng,
        altitude,
        speed,
        temp,
        hum,
        aqi,
        co2ppm,
        mq135Raw,
        mq135Volt,
        vocAvg,
        vocStd,
        co2Avg,
        co2Std,
        vibAmp,
        vibFreq,
        hour,
        srcLabel,
        srcConf,
        co2eq,
        emMethod,
        fw,
        grid,
      ]
        .map((val) => (val === '' ? '' : String(val)))
        .join(',');

      res.write(row + '\n');
    });

    cursor.on('end', () => {
      res.end();
    });

    cursor.on('error', (err) => {
      console.error('CSV cursor error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error generating CSV');
      } else {
        res.end();
      }
    });
  } catch (err) {
    console.error('Error in /api/exports/readings/csv:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal CSV export error');
    } else {
      res.end();
    }
  }
});

// ------------ Export subscriptions ------------
app.post('/api/exports/subscription', async (req, res) => {
  try {
    const { email, exports, runUrl } = req.body;

    console.log('SUBSCRIPTION HIT with body =>', { email, exports, runUrl });
    console.log('N8N_SUBSCRIPTION_WEBHOOK =>', process.env.N8N_SUBSCRIPTION_WEBHOOK);

    if (!email || !runUrl) {
      return res
        .status(400)
        .json({ ok: false, error: 'email and runUrl required' });
    }

    const subs = await ExportSubscription.findOneAndUpdate(
      { email },
      {
        email,
        exports: exports || {
          co2Digest: true,
          emissionsLedger: false,
          sourceDebug: false,
        },
        runUrl,
      },
      { upsert: true, new: true },
    );

    const n8nWebhookUrl = process.env.N8N_SUBSCRIPTION_WEBHOOK;
    if (n8nWebhookUrl) {
      try {
        console.log('CALLING N8N WEBHOOK =>', n8nWebhookUrl);
        await axios.post(n8nWebhookUrl, {
          email,
          exports: subs.exports,
          runUrl: subs.runUrl,
        });
        console.log('N8N WEBHOOK CALL OK');
      } catch (e) {
        console.error(
          'Error calling n8n subscription webhook:',
          e.response?.status,
          e.response?.data || e.message,
        );
      }
    } else {
      console.error('N8N_SUBSCRIPTION_WEBHOOK is NOT set');
    }

    return res.json({ ok: true, subscription: subs });
  } catch (err) {
    console.error('Error in /api/exports/subscription:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Subscription save error' });
  }
});

// ------------ Export recipes ------------
// create recipe
app.post('/api/exports/recipe', async (req, res) => {
  try {
    const {
      name,
      questionText = '',
      deviceId = null,
      context = 'all',
      timeRange,
      fields = [],
      format = 'csv',
      language = 'python',
      delivery = {},
    } = req.body;

    if (!name || !timeRange?.from || !timeRange?.to) {
      return res.status(400).json({
        ok: false,
        error: 'name, timeRange.from, timeRange.to required',
      });
    }

    const recipeId =
      'rec_' +
      crypto
        .createHash('sha256')
        .update(name + String(timeRange.from) + String(timeRange.to))
        .digest('hex')
        .slice(0, 10);

    const recipe = await ExportRecipe.findOneAndUpdate(
      { recipeId },
      {
        recipeId,
        name,
        questionText,
        deviceId,
        context,
        timeRange,
        fields,
        format,
        language,
        delivery,
      },
      { upsert: true, new: true },
    );

    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://172.31.111.86:5000';

    return res.json({
      ok: true,
      recipe,
      runUrl: `${baseUrl}/api/exports/recipe/${recipe.recipeId}/run`,
    });
  } catch (err) {
    console.error('Error in /api/exports/recipe:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Failed to create export recipe' });
  }
});

// run recipe: stream CSV based on stored config
app.get('/api/exports/recipe/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await ExportRecipe.findOne({ recipeId: id }).lean();

    if (!recipe) {
      return res.status(404).send('Recipe not found');
    }

    const { timeRange, deviceId, context } = recipe;
    const { filter } = buildExportFilter({
      from: timeRange.from,
      to: timeRange.to,
      deviceId,
      context,
    });

    const cursor = Reading.find(filter).sort({ timestamp: 1 }).cursor();

    const defaultColumns = [
      'timestamp',
      'deviceId',
      'sessionId',
      'location.context',
      'location.lat',
      'location.lng',
      'location.altitude',
      'location.speed',
      'environment.temperature',
      'environment.humidity',
      'air.aqi',
      'air.co2ppm',
      'air.mq135Raw',
      'air.mq135Volt',
      'aiFeatures.vocAvg',
      'aiFeatures.vocStd',
      'aiFeatures.co2Avg',
      'aiFeatures.co2Std',
      'aiFeatures.vibrationAmp',
      'aiFeatures.vibrationFreq',
      'aiFeatures.Hour',
      'sourceClassification.label',
      'sourceClassification.confidence',
      'emissions.estimatedCO2eqKg',
      'emissions.method',
      'meta.firmwareVersion',
      'meta.gridRegion',
    ];

    const columns =
      Array.isArray(recipe.fields) && recipe.fields.length > 0
        ? recipe.fields
        : defaultColumns;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="atmostrack-${recipe.recipeId}.csv"`,
    );

    res.write(columns.join(',') + '\n');

    cursor.on('data', (doc) => {
      const rowValues = columns.map((col) => {
        if (col === 'timestamp') {
          return doc.timestamp ? new Date(doc.timestamp).toISOString() : '';
        }
        const val = getPath(doc, col);
        if (val === undefined || val === null) return '';
        return String(val);
      });

      res.write(rowValues.join(',') + '\n');
    });

    cursor.on('end', async () => {
      await ExportRecipe.updateOne(
        { recipeId: id },
        {
          $set: { lastRunAt: new Date() },
          $inc: { runCount: 1 },
        },
      );
      res.end();
    });

    cursor.on('error', (err) => {
      console.error('Recipe CSV cursor error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error generating recipe CSV');
      } else {
        res.end();
      }
    });
  } catch (err) {
    console.error('Error in /api/exports/recipe/:id/run:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal recipe run error');
    } else {
      res.end();
    }
  }
});

// ------------ AQI / emissions helpers ------------
function estimateAQIFromMQ135(raw) {
  if (raw == null) return 75;
  return Math.max(0, Math.min(500, Math.round((raw / 4095) * 300)));
}

function estimateEmissionsKgFromCO2ppm(ppm) {
  if (!ppm) return 0;
  return Number((ppm / 1_000_000_000).toFixed(8));
}

// ------------ Sensor ingest ------------
app.post('/api/sensor-data', async (req, res) => {
  const {
    deviceId = 'ATMOSTRACK-01',
    sessionId = 'default-session',
    environment = {},
    imu = {},
    location = {},
    purification = {},
    co2Level = null,
    mq135 = {},
    context = 'indoor',
  } = req.body;

  const processedCO2 =
    co2Level !== null
      ? {
          ppm: parseFloat(Number(co2Level).toFixed(1)),
          status: getCO2Status(Number(co2Level)),
          healthAdvice: getCO2HealthAdvice(Number(co2Level)),
        }
      : null;

  const timestamp = new Date();

  const preservedLat =
    latestSensorData &&
    latestSensorData.deviceId === deviceId &&
    latestSensorData.location &&
    latestSensorData.location.lat != null
      ? latestSensorData.location.lat
      : location.lat ?? null;

  const preservedLng =
    latestSensorData &&
    latestSensorData.deviceId === deviceId &&
    latestSensorData.location &&
    latestSensorData.location.lng != null
      ? latestSensorData.location.lng
      : location.lng ?? null;

  const preservedSpeed =
    location.speed ??
    (latestSensorData &&
    latestSensorData.deviceId === deviceId &&
    latestSensorData.location
      ? latestSensorData.location.speed ?? null
      : null);

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
      lat: preservedLat,
      lng: preservedLng,
      speed: preservedSpeed,
    },
    purification: {
      on: true,
    },
    co2: processedCO2,
    mq135: {
      raw: mq135.raw ?? null,
      volt: mq135.volt ?? null,
    },
    timestamp: timestamp.toISOString(),
  };

  aiWindow.push(sensorReading);
  if (aiWindow.length > WINDOW_SIZE) {
    aiWindow = aiWindow.slice(-WINDOW_SIZE);
  }

  let CO2_avg = null;
  let CO2_std = null;

  const co2Values = aiWindow
    .map((r) =>
      r.co2 && typeof r.co2.ppm === 'number' ? r.co2.ppm : null,
    )
    .filter((v) => v !== null);

  if (co2Values.length > 0) {
    const mean =
      co2Values.reduce((a, b) => a + b, 0) / co2Values.length;
    const variance =
      co2Values
        .map((v) => (v - mean) ** 2)
        .reduce((a, b) => a + b, 0) / co2Values.length;
    CO2_avg = mean;
    CO2_std = Math.sqrt(variance);
  }

  const now = new Date();
  const Hour = now.getHours();

  const VOC_values = aiWindow
    .map((r) =>
      r.mq135 && typeof r.mq135.raw === 'number'
        ? r.mq135.raw
        : null,
    )
    .filter((v) => v !== null);

  let VOC_avg = null;
  let VOC_std = null;
  if (VOC_values.length > 0) {
    const meanVOC =
      VOC_values.reduce((a, b) => a + b, 0) / VOC_values.length;
    const varianceVOC =
      VOC_values
        .map((v) => (v - meanVOC) ** 2)
        .reduce((a, b) => a + b, 0) / VOC_values.length;
    VOC_avg = meanVOC;
    VOC_std = Math.sqrt(varianceVOC);
  }

  const vibValues = aiWindow
    .map((r) =>
      r.imu &&
      r.imu.ax !== null &&
      r.imu.ay !== null &&
      r.imu.az !== null
        ? (Math.abs(r.imu.ax) +
            Math.abs(r.imu.ay) +
            Math.abs(r.imu.az)) /
          3
        : null,
    )
    .filter((v) => v !== null);

  let Vibration_amp = null;
  let Vibration_freq = null;
  if (vibValues.length > 0) {
    Vibration_amp =
      vibValues.reduce((a, b) => a + b, 0) / vibValues.length;
    const threshold = 15000;
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

  latestSensorData = sensorReading;
  sensorHistory.push(sensorReading);
  if (sensorHistory.length > 100) {
    sensorHistory = sensorHistory.slice(-100);
  }

  io.emit('sensorUpdate', sensorReading);

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
        const rawResult = response.data;
        const adjusted = adjustSourceClassification(
          sensorReading,
          rawResult,
        );
        sensorReading.sourceClassification = adjusted;
        latestSensorData = sensorReading;
        io.emit('sensorUpdate', sensorReading);
      })
      .catch((err) => {
        console.error('AI server error:', err.message);
      });
  }

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
      `PUR=${sensorReading.purification.on ? 'ON' : 'OFF'}`,
  );

  try {
    const aqi = estimateAQIFromMQ135(sensorReading.mq135.raw);
    const co2ppm = processedCO2 ? processedCO2.ppm : 0;
    const estimatedCO2eqKg =
      estimateEmissionsKgFromCO2ppm(co2ppm);

    const readingDoc = {
      deviceId,
      sessionId,
      timestamp,
      location: {
        lat: sensorReading.location.lat,
        lng: sensorReading.location.lng,
        altitude: null,
        context,
      },
      environment: {
        temperature: sensorReading.environment.temperature,
        humidity: sensorReading.environment.humidity,
      },
      air: {
        aqi,
        co2ppm,
        mq135Raw: sensorReading.mq135.raw,
        mq135Volt: sensorReading.mq135.volt,
      },
      purification: {
        on: true,
      },
      aiFeatures: {
        vocAvg: VOC_avg,
        vocStd: VOC_std,
        co2Avg: CO2_avg,
        co2Std: CO2_std,
        vibrationAmp: Vibration_amp,
        vibrationFreq: Vibration_freq,
        Hour,
      },
      sourceClassification: sensorReading.sourceClassification
        ? {
            label: sensorReading.sourceClassification.label,
            confidence:
              sensorReading.sourceClassification.confidence,
          }
        : {
            label: 'Unknown',
            confidence: 0,
          },
      emissions: {
        estimatedCO2eqKg,
        method: 'model',
      },
      meta: {
        firmwareVersion: '1.0.0',
        gridRegion: 'IN-SOUTH',
      },
    };

    await Reading.create(readingDoc);
    console.log('SAVED READING', { deviceId, timestamp });
  } catch (err) {
    console.error('Error saving Reading to MongoDB:', err.message);
  }

  res.json({ success: true, data: sensorReading });
});

// ------------ Phone-based location correction ------------
app.post('/api/nodes/set-location', async (req, res) => {
  try {
    const { deviceId, lat, lng, timestamp } = req.body;

    if (!deviceId || typeof lat !== 'number' || typeof lng !== 'number') {
      return res
        .status(400)
        .json({
          success: false,
          error: 'deviceId, lat, lng are required',
        });
    }

    const ts = timestamp ? new Date(timestamp) : new Date();

    if (latestSensorData && latestSensorData.deviceId === deviceId) {
      latestSensorData.location = {
        lat,
        lng,
        speed: latestSensorData.location?.speed ?? null,
      };
      io.emit('sensorUpdate', latestSensorData);
    }

    sensorHistory = sensorHistory.map((r) =>
      r.deviceId === deviceId
        ? {
            ...r,
            location: {
              lat,
              lng,
              speed: r.location?.speed ?? null,
            },
          }
        : r,
    );

    const dayStart = new Date(ts);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(ts);
    dayEnd.setHours(23, 59, 59, 999);

    await Reading.updateMany(
      {
        deviceId,
        timestamp: { $gte: dayStart, $lte: dayEnd },
      },
      {
        $set: {
          'location.lat': lat,
          'location.lng': lng,
        },
      },
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/nodes/set-location:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Server error' });
  }
});

// ------------ Latest + health ------------
app.get('/api/latest', (req, res) => {
  res.json({
    success: true,
    data: latestSensorData,
    isOnline: latestSensorData
      ? Date.now() -
          new Date(latestSensorData.timestamp).getTime() <
        30000
      : false,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AtmosTrack Multi-Sensor Backend',
    version: '3.1.0',
    sensors: ['DHT11', 'MG811', 'MQ135', 'MPU6050', 'GPS'],
    dataPoints: sensorHistory.length,
    lastReading: latestSensorData
      ? latestSensorData.timestamp
      : null,
  });
});

// ------------ DHI + batches ------------
async function computeDHIForDay({ deviceId, date }) {
  const fromTs = new Date(date + 'T00:00:00.000Z');
  const toTs = new Date(date + 'T23:59:59.999Z');

  const SAMPLE_INTERVAL_SECONDS = 30;
  const TOKENS_PER_DHI_HOUR = 0.1;

  const readings = await Reading.find({
    timestamp: { $gte: fromTs, $lte: toTs },
  })
    .sort({ timestamp: 1 })
    .lean();

  console.log('DHI DEBUG', {
    deviceId,
    date,
    fromTs,
    toTs,
    count: readings.length,
    first: readings[0]?.timestamp,
    last: readings[readings.length - 1]?.timestamp,
  });

  if (!readings.length) {
    return null;
  }

  const count = readings.length;
  const hoursByCadence =
    (count * SAMPLE_INTERVAL_SECONDS) / 3600;

  const firstTs = new Date(readings[0].timestamp).getTime();
  const lastTs = new Date(
    readings[readings.length - 1].timestamp,
  ).getTime();
  const spanHours =
    (lastTs - firstTs) / (1000 * 60 * 60);

  const dhiHours = Math.min(
    hoursByCadence,
    Math.max(spanHours, 0.0167),
  );
  const tokens = Number(
    (dhiHours * TOKENS_PER_DHI_HOUR).toFixed(4),
  );

  const batchId = crypto
    .createHash('sha256')
    .update(
      `${deviceId}-${date}-${fromTs.toISOString()}-${toTs.toISOString()}`,
    )
    .digest('hex')
    .slice(0, 16);

  const batch = await CreditBatch.findOneAndUpdate(
    { batchId },
    {
      batchId,
      deviceId,
      fromTs,
      toTs,
      date,
      dhiHours,
      tokens,
      aqiThreshold: 0,
      status: 'PENDING',
    },
    { upsert: true, new: true },
  );

  return batch;
}

// POST: compute one batch for a day
app.post('/api/carbon/credit-batch', async (req, res) => {
  try {
    const { deviceId = 'ATMOSTRACK-01', date } = req.body;
    if (!date) {
      return res
        .status(400)
        .json({
          ok: false,
          error: 'date (YYYY-MM-DD) required',
        });
    }

    const batch = await computeDHIForDay({ deviceId, date });

    if (!batch) {
      return res.json({
        ok: true,
        message:
          'No impact hours for this day/device (no readings or device offline)',
      });
    }

    return res.json({ ok: true, batch });
  } catch (err) {
    console.error('Error in /api/carbon/credit-batch:', err);
    return res
      .status(500)
      .json({
        ok: false,
        error: 'Internal DHI calculation error',
      });
  }
});

// simulate on-chain mint
app.post('/api/carbon/mint-onchain', async (req, res) => {
  try {
    const { batchId, walletAddress } = req.body;

    if (!batchId || !walletAddress) {
      return res
        .status(400)
        .json({
          ok: false,
          error: 'batchId and walletAddress required',
        });
    }

    const batch = await CreditBatch.findOne({ batchId });

    if (!batch) {
      return res
        .status(404)
        .json({ ok: false, error: 'Batch not found' });
    }

    if (batch.status === 'MINTED') {
      return res.json({
        ok: true,
        alreadyMinted: true,
        batch,
      });
    }

    const fakeTxHash =
      'SIMULATED_POLYGON_TX_' + batchId.slice(0, 8);

    batch.status = 'MINTED';
    batch.txHash = fakeTxHash;
    await batch.save();

    return res.json({
      ok: true,
      simulated: true,
      batch,
      txHash: fakeTxHash,
    });
  } catch (err) {
    console.error('Error in /api/carbon/mint-onchain:', err);
    return res
      .status(500)
      .json({
        ok: false,
        error: 'Mint-onchain server error',
      });
  }
});

// list batches
app.get('/api/carbon/batches', async (req, res) => {
  try {
    const { deviceId } = req.query;
    const filter = deviceId ? { deviceId: String(deviceId) } : {};
    const batches = await CreditBatch.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ ok: true, batches });
  } catch (err) {
    console.error('Error in /api/carbon/batches:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Batch list error' });
  }
});

// ------------ WebSocket ------------
io.on('connection', (socket) => {
  console.log(
    '🔌 Frontend connected from:',
    socket.handshake.address,
  );

  if (latestSensorData) {
    socket.emit('sensorUpdate', latestSensorData);
    console.log(
      '📤 Sent latest multi-sensor data to new connection',
    );
  }

  socket.on('disconnect', () => {
    console.log('❌ Frontend disconnected');
  });
});

// ------------ CO2 helpers ------------
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
  if (ppm < 2000)
    return 'Acceptable but may cause drowsiness';
  if (ppm < 5000)
    return 'Poor air quality - increase ventilation';
  return 'Dangerous levels - evacuate immediately';
}

// ------------ Server listen ------------
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 AtmosTrack Multi-Sensor Backend running on http://0.0.0.0:${PORT}`,
  );
  console.log(
    '🔗 Accepting connections from Vite frontend on port 5173',
  );
  console.log(
    '📡 WebSocket CORS enabled for localhost:5173',
  );
  console.log(
    '🌍 Sensors: DHT11 + MG811 + MQ135 + MPU6050 + GPS',
  );
  console.log('📊 API Endpoints:');
  console.log(
    '   POST /api/sensor-data - ESP32 data input',
  );
  console.log(
    '   POST /api/nodes/set-location - Phone location input',
  );
  console.log(
    '   GET  /api/latest         - Latest readings',
  );
  console.log(
    '   GET  /api/health         - System health',
  );
  console.log(
    '   GET  /api/exports/readings - Export filter endpoint v1',
  );
  console.log(
    '   GET  /api/exports/readings/csv - CSV export endpoint',
  );
  console.log(
    '   POST /api/exports/recipe - Create export recipe',
  );
  console.log(
    '   POST /api/exports/subscription - Save export subscription',
  );
  console.log(
    '   GET  /api/exports/recipe/:id/run - Run export recipe',
  );
  console.log(
    '   POST /api/carbon/credit-batch - Compute DHI + tokens for a day',
  );
  console.log(
    '   POST /api/carbon/mint-onchain - Simulate on-chain mint for a batch',
  );
  console.log(
    '   GET  /api/carbon/batches      - List recent credit batches',
  );
});
