// Routes/VIN.js

import express from 'express';
import { Vin, VINLog } from '../models/VinModels.js'
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// ✅ GET: All authorized VINs (protected)
router.get("/vins", protect, async (req, res) => {
  try {
    const vins = await Vin.find({ isAuthorized: true });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch VINs" });
  }
});

// ✅ POST: Add or update a VIN (protected)
router.post("/vins", protect, async (req, res) => {
  const { vin, isAuthorized } = req.body;
  try {
    const found = await Vin.findOne({ vin });
    if (found) {
      found.isAuthorized = isAuthorized;
      await found.save();
      return res.json({ message: "VIN updated" });
    }
    await Vin.create({ vin, isAuthorized });
    res.json({ message: "VIN added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add/update VIN" });
  }
});

// ✅ POST: Save scanned VIN to VINLog (open)
router.post('/scan', async (req, res) => {
  try {
    const { vin, result, lat, lng } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newLog = new VINLog({
      vin,
      result,
      ipAddress: ip,
      location: {
        latitude: lat,
        longitude: lng,
      },
      scannedAt: new Date(),
    });

    await newLog.save();
    res.status(201).json({ message: 'VIN scan saved with location and IP', data: newLog });
  } catch (error) {
    console.error('Error saving VIN scan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT: Log VIN scan in `Vin` model (open)
router.put("/scan/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
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
    res.json({ message: "Scan logged" });
  } catch (err) {
    res.status(500).json({ error: "Failed to log scan" });
  }
});

// ✅ GET: Logs from `Vin` model (protected)
router.get("/logs", protect, async (req, res) => {
  try {
    const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ✅ GET: Filtered logs by VIN, date range, and location (open)
router.get("/logs/filter", async (req, res) => {
  const { vin, from, to, location } = req.query;

  let query = {};
  if (vin) query.vin = vin;
  if (location) query['location.name'] = { $regex: location, $options: 'i' };
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  try {
    const logs = await Vin.find(query).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch filtered logs" });
  }
});

export default router;
