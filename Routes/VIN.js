// Routes/VIN.js

import express from 'express';
import { Vin, VINLog } from '../models/VinModels.js';
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
    let found = await Vin.findOne({ vin });
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

// ✅ POST: Scan handler – save to both VINLog and Vin model
router.post('/scan', async (req, res) => {
  try {
    const { vin, result, lat, lng } = req.body;
    console.log(vin,result);
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Save to VINLog collection
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

    // Update `scannedLogs` array in VIN model
    let existing = await Vin.findOne({ vin });
    if (!existing) {
      existing = new Vin({ vin });
    }

    existing.scannedLogs.push({
      timestamp: new Date(),
      ip,
      location: lat && lng ? `${lat},${lng}` : "unknown",
    });

    await existing.save();

    res.status(201).json({ message: 'Scan saved successfully', data: { vinLog: newLog } });
  } catch (error) {
    console.error('Error saving VIN scan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: All VIN scan logs (protected)
router.get("/logs", protect, async (req, res) => {
  try {
    const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ✅ GET: Filtered VIN logs (open)
router.get("/logs/filter", async (req, res) => {
  const { vin, from, to, location } = req.query;

  let query = {};

  if (vin) query.vin = vin;
  if (location) query["scannedLogs.location"] = { $regex: location, $options: 'i' };
  if (from || to) {
    query["scannedLogs.timestamp"] = {};
    if (from) query["scannedLogs.timestamp"].$gte = new Date(from);
    if (to) query["scannedLogs.timestamp"].$lte = new Date(to);
  }

  try {
    const logs = await Vin.find(query).sort({ "scannedLogs.timestamp": -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch filtered logs" });
  }
});

export default router;
