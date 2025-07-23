const express = require("express");
const {Vin} = require("../Models/Vin");
const verifyToken = require("./Middleware/authMiddleware");
const router = express.Router();

// ✅ Get all authorized VINs (protected)
router.get("/vins", verifyToken, async (req, res) => {
  const vins = await Vin.find({ isAuthorized: true });
  res.json(vins);
});

// ✅ Add/update VIN (protected)
router.post("/vins", verifyToken, async (req, res) => {
  const { vin, isAuthorized } = req.body;
  const found = await Vin.findOne({ vin });
  if (found) {
    found.isAuthorized = isAuthorized;
    await found.save();
    return res.json({ message: "VIN updated" });
  }
  await Vin.create({ vin, isAuthorized });
  res.json({ message: "VIN added" });
});

// ✅ Log VIN scan (open)
router.put("/scan/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const found = await Vin.findOne({ vin });

  if (!found || !found.isAuthorized) {
    return res.status(403).json({ message: "Unauthorized VIN" });
  }

  found.scannedLogs.push({ timestamp: new Date(), ip, location });
  await found.save();
  res.json({ message: "Scan logged" });
});

// ✅ Get logs (protected)
router.get("/logs", verifyToken, async (req, res) => {
  const vins = await Vin.find({ scannedLogs: { $exists: true, $ne: [] } });
  res.json(vins);
});

// PUT: Log scan with IP & GPS


// PUT: Log scan with IP & GPS
app.put("/api/vin/:vin", async (req, res) => {
  const vin = req.params.vin;
  const { location } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

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

// GET /api/logs?vin=XYZ123&from=2025-07-01&to=2025-07-22&location=Lucknow
router.get("/logs", async (req, res) => {
  const { vin, from, to, location } = req.query;

  let query = {};
  if (vin) query.vin = vin;
  if (location) query.location = { $regex: location, $options: "i" };
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  try {
    const logs = await Vin.find(query).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});



module.exports = router;
