import express from "express";
import { saveVIN } from "../Controller/vinController.js";
import {Vin} from "../Models/VinModels.js";
import {VINLog} from "../Models/VinModels.js"; 
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

/**
 * ✅ POST: Scan VIN & Save (with validations)
 */
router.post("/scan", saveVIN);

/**
 * ✅ GET: Fetch all authorized VINs (protected)
 */
router.get("/vins", protect, async (req, res) => {
  try {
    const vins = await Vin.find({ isAuthorized: true });
    res.json(vins);
  } catch (err) {
    console.error("Error fetching VINs:", err);
    res.status(500).json({ error: "Failed to fetch VINs" });
  }
});

/**
 * ✅ POST: Add or update a VIN authorization (protected)
 */
router.post("/vins", protect, async (req, res) => {
  const { vin, isAuthorized } = req.body;
  try {
    let found = await Vin.findOne({ vin });

    if (found) {
      found.isAuthorized = isAuthorized;
      await found.save();
      return res.json({ message: "VIN updated successfully" });
    }

    await Vin.create({ vin, isAuthorized });
    res.json({ message: "VIN added successfully" });
  } catch (err) {
    console.error("Error saving VIN:", err);
    res.status(500).json({ error: "Failed to add/update VIN" });
  }
});

/**
 * ✅ POST: Log a VIN scan (extra logging layer)
 */
router.post("/scan-log", async (req, res) => {
  try {
    const { vin, result, lat, lng, userAgent } = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Save to VINLog collection
    const newLog = new VINLog({
      vin,
      result,
      ipAddress: ip,
      userAgent,
      location: { latitude: lat || null, longitude: lng || null },
      scannedAt: new Date(),
    });
    await newLog.save();

    // Update or create VIN entry with embedded logs
    let existing = await Vin.findOne({ vin });
    if (!existing) existing = new Vin({ vin });

    existing.scannedLogs.push({
      timestamp: new Date(),
      ip,
      userAgent,
      location: { latitude: lat || null, longitude: lng || null },
      result,
    });

    await existing.save();

    res.status(201).json({
      message: "Scan log saved successfully",
      data: { vinLog: newLog },
    });
  } catch (error) {
    console.error("Error saving VIN scan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ GET: Fetch all VIN scan logs (protected)
 */
router.get("/logs", protect, async (req, res) => {
  try {
    const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
    res.json(vins);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/**
 * ✅ GET: Filtered VIN logs (open)
 * Query params: vin, from, to, location
 */
router.get("/logs/filter", async (req, res) => {
  const { vin, from, to, location } = req.query;
  let query = {};

  if (vin) query.vin = vin;
  if (location) query["scannedLogs.location"] = { $regex: location, $options: "i" };
  if (from || to) {
    query["scannedLogs.timestamp"] = {};
    if (from) query["scannedLogs.timestamp"].$gte = new Date(from);
    if (to) query["scannedLogs.timestamp"].$lte = new Date(to);
  }

  try {
    const logs = await Vin.find(query).sort({ "scannedLogs.timestamp": -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error filtering logs:", err);
    res.status(500).json({ error: "Failed to fetch filtered logs" });
  }
});

export default router;
