// models/Reading.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const LocationSchema = new Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    altitude: { type: Number, default: null },
    context: { type: String, enum: ['indoor', 'outdoor'], required: true },
  },
  { _id: false }
);

const EnvironmentSchema = new Schema(
  {
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
  },
  { _id: false }
);

const AirSchema = new Schema(
  {
    aqi: { type: Number, required: true },
    co2ppm: { type: Number, required: true },
    mq135Raw: { type: Number, default: null },
    mq135Volt: { type: Number, default: null },
  },
  { _id: false }
);

const AiFeaturesSchema = new Schema(
  {
    vocAvg: { type: Number, default: null },
    vocStd: { type: Number, default: null },
    co2Avg: { type: Number, default: null },
    co2Std: { type: Number, default: null },
    vibrationAmp: { type: Number, default: null },
    vibrationFreq: { type: Number, default: null },
    Hour: { type: Number, required: true },
  },
  { _id: false }
);

const SourceClassificationSchema = new Schema(
  {
    label: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false }
);

const EmissionsSchema = new Schema(
  {
    estimatedCO2eqKg: { type: Number, required: true },
    method: { type: String, enum: ['direct', 'model'], required: true },
  },
  { _id: false }
);

const MetaSchema = new Schema(
  {
    firmwareVersion: { type: String },
    gridRegion: { type: String },
  },
  { _id: false }
);

const ReadingSchema = new Schema(
  {
    deviceId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    location: { type: LocationSchema, required: true },
    environment: { type: EnvironmentSchema, required: true },
    air: { type: AirSchema, required: true },
    aiFeatures: { type: AiFeaturesSchema, required: true },
    sourceClassification: { type: SourceClassificationSchema, required: true },
    emissions: { type: EmissionsSchema, required: true },
    meta: { type: MetaSchema },
    // ── Blockchain integrity fields ──────────────────────────────────────────
    // SHA-256 fingerprint of the immutable sensor payload (computed at ingest).
    // If any field is later altered in MongoDB, re-hashing will NOT match this value.
    dataHash: { type: String, index: true },
    // Tracks on-chain anchoring lifecycle: PENDING → ANCHORED (Phase 2)
    anchorStatus: {
      type: String,
      enum: ['PENDING', 'ANCHORED'],
      default: 'PENDING',
    },
    // Will hold the Polygon transaction hash once Phase 2 is deployed
    txHash: { type: String, default: null },
  },
  {
    timestamps: false,
  }
);

export const Reading =
  mongoose.models.Reading || mongoose.model('Reading', ReadingSchema);
