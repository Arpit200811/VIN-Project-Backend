// models/VinModels.js

import mongoose from 'mongoose';

// --- VINLog Schema ---
const VINLogSchema = new mongoose.Schema({
  vin: {
    type: String,
    required: true,
  },
  result: {
    type: String, // "metal" or "paper"
    required: true,
  },
  ipAddress: String,
  location: {
    latitude: Number,
    longitude: Number,
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
});

export const VINLog = mongoose.model('VINLog', VINLogSchema);

// --- VIN Schema ---
const VinSchema = new mongoose.Schema({
  vin: {
    type: String,
    required: true,
    unique: true,
    minlength: 17,
    maxlength: 17,
    match: /^[A-HJ-NPR-Z0-9]{17}$/, // excludes I, O, Q
  },
  isAuthorized: {
    type: Boolean,
    default: false,
  },
  scannedLogs: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ip: String,
      location: String, // plain text or "lat,lon"
    },
  ],
});

export const Vin = mongoose.model('Vin', VinSchema);

// ✅ Export both models using ES module named export
