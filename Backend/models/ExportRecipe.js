// models/ExportRecipe.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const { Schema } = mongoose;

const TimeRangeSchema = new Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const DeliverySchema = new Schema(
  {
    emailEnabled: { type: Boolean, default: false },
    emailTo: { type: String, default: null },
    driveEnabled: { type: Boolean, default: false },
    driveType: {
      type: String,
      enum: ['gdrive', 's3', 'webdav', null],
      default: null,
    },
    drivePath: { type: String, default: null },
  },
  { _id: false }
);

const ExportRecipeSchema = new Schema(
  {
    recipeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    questionText: { type: String, default: '' },

    deviceId: { type: String, default: null },
    context: {
      type: String,
      enum: ['indoor', 'outdoor', 'all'],
      default: 'all',
    },

    timeRange: { type: TimeRangeSchema, required: true },

    fields: { type: [String], default: [] },

    format: {
      type: String,
      enum: ['csv'],
      default: 'csv',
    },
    language: {
      type: String,
      enum: ['python'],
      default: 'python',
    },

    delivery: { type: DeliverySchema, default: () => ({}) },

    /**
     * Per-recipe secret token included in the runUrl query string.
     * This secures the unauthenticated n8n automation endpoint without
     * requiring a JWT (which n8n cannot easily provide on cron triggers).
     */
    accessToken: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },

    createdAt: { type: Date, default: Date.now },
    lastRunAt: { type: Date, default: null },
    runCount: { type: Number, default: 0 },
  },
  {
    timestamps: false,
  }
);

export const ExportRecipe =
  mongoose.models.ExportRecipe ||
  mongoose.model('ExportRecipe', ExportRecipeSchema);
