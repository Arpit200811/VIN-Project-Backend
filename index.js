const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./Routes/authRoutes');
const { Vin } = require("./Models/Vin");
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./Routes/authRoutes"));

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// ✅ Get all authorized VINs
app.get("/api/vins", async (req, res) => {
  const vins = await Vin.find({ isAuthorized: true });
  res.json(vins);
});

// ✅ Add or update VIN (Admin Panel)
app.post("/api/admin/vins", async (req, res) => {
  const { vin, isAuthorized } = req.body;
  try {
    let found = await Vin.findOne({ vin });
    if (found) {
      found.isAuthorized = isAuthorized;
      await found.save();
      return res.json({ message: "VIN updated." });
    } else {
      await Vin.create({ vin, isAuthorized });
      return res.json({ message: "VIN added." });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ✅ Log VIN scan
app.put("/api/vin/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const found = await Vin.findOne({ vin });

    if (!found || !found.isAuthorized) {
      return res.status(403).json({ message: "❌ Unauthorized VIN" });
    }

    found.scannedLogs.push({
      timestamp: new Date(),
      ip,
      location,
    });
    await found.save();
    res.json({ message: "✅ VIN logged successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Log scan
app.put("/api/vin/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const found = await Vin.findOne({ vin });

  if (!found || !found.isAuthorized) {
    return res.status(403).json({ message: "Unauthorized VIN" });
  }

  found.scannedLogs.push({
    timestamp: new Date(),
    ip,
    location,
  });

  await found.save();
  res.json({ message: "VIN logged successfully" });
});

// ✅ Admin - View all VIN scan logs
app.get("/api/admin/logs", async (req, res) => {
  const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
  res.json(vins);
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
