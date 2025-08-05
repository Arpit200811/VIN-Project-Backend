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

const VINLog = mongoose.model('VINLog', VINLogSchema);

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
      location: String, // "lat,lng" or human-readable
    },
  ],
});

const Vin = mongoose.model('Vin', VinSchema);

export { Vin, VINLog };
