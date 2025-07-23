// models/Vin.js
const mongoose = require("mongoose");

const VinSchema = new mongoose.Schema({
  vin: {
    type: String,
    required: true,
    unique: true,
    minlength: 17,
    maxlength: 17,
    match: /^[A-HJ-NPR-Z0-9]{17}$/  // excludes I, O, Q
  },
  isAuthorized: {
    type: Boolean,
    default: false
  },
  scannedLogs: [
    {
      timestamp: {
        type: Date,
        default: Date.now
      },
      ip: String,
      location: String
    }
  ]
});

const Vin = mongoose.model("Vin", VinSchema);
module.exports = { Vin };
