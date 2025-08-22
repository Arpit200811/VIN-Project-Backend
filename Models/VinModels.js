import mongoose from "mongoose";

const VinSchema = new mongoose.Schema(
  {
    vin: { type: String, required: true, unique: true, index: true },
    isAuthorized: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

 export const Vin = mongoose.model("Vin", VinSchema);
const VinLogSchema = new mongoose.Schema(
  {
    vin: { type: String, required: true },
    surface: { type: String, enum: ["metal", "paper", "other"], required: false },
    probability: { type: Number, default: null },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },
    userAgent: { type: String },
    ip: { type: String },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const VINLog = mongoose.model("VinLog", VinLogSchema);
