import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import DB_Connect from './DB_Config/DB_Connect.js'; // Connects to MongoDB
import authRoutes from './Routes/authRoutes.js';
import vinRoutes from './Routes/VIN.js';
import { Vin } from './models/VinModels.js'; // ✅ Works correctly
import  router  from './Routes/VIN.js'
 // 🛠️ Required for direct VIN access in route handlers

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api',router)
app.use("/api/auth", authRoutes);
app.use("/api/vin", vinRoutes);

// ✅ VIN Management Routes (Admin + Log Scanning)

// Get all authorized VINs
app.get("/api/vins", async (req, res) => {
  try {
    const vins = await Vin.find({ isAuthorized: true });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update VIN (Admin Panel)
app.post("/api/admin/vins", async (req, res) => {
  const { vin, isAuthorized } = req.body;
  try {
    let found = await Vin.findOne({ vin });
    if (found) {
      found.isAuthorized = isAuthorized;
      await found.save();
      return res.json({ message: "✅ VIN updated." });
    } else {
      await Vin.create({ vin, isAuthorized });
      return res.json({ message: "✅ VIN added." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Log VIN scan
app.put("/api/vin/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

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

// View all scan logs
app.get("/api/admin/logs", async (req, res) => {
  try {
    const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Start server after DB connects
DB_Connect().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
