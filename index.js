import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

import DB_Connect from "./DB_Config/DB_Connect.js"; // Custom DB connection util
import authRoutes from "./Routes/authRoutes.js";
import vinRoutes from "./Routes/VIN.js";
import { Vin } from "./Models/VinModels.js";
import router from "./Routes/VIN.js";

dotenv.config();

const app = express();

// ✅ Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ✅ DB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vin_db";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("Mongo error:", e.message));

// ✅ Health Check
app.get("/", (_req, res) => res.json({ ok: true }));

// ✅ Routes
app.use("/api", router);
app.use("/api/auth", authRoutes);
app.use("/api/vin", vinRoutes);

// 🔹 VIN Management Routes
app.get("/api/vins", async (_req, res) => {
  try {
    const vins = await Vin.find({ isAuthorized: true });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

app.get("/api/admin/logs", async (_req, res) => {
  try {
    const vins = await Vin.find({
      scannedLogs: { $exists: true, $ne: [] },
    });
    res.json(vins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ message: "Server error" });
});

// ✅ Start server after DB connects
DB_Connect().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
