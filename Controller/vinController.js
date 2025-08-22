import {Vin} from "../Models/VinModels.js";

// VIN checksum validator (ISO 3779 standard)
const translit = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
  J:1,K:2,L:3,M:4,N:5,P:7,R:9,
  S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
  "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9
};
const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

function isValidVIN(vinRaw) {
  if (!vinRaw) return false;
  const vin = vinRaw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (vin.length !== 17) return false;
  if (/[IOQ]/.test(vin)) return false;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const val = translit[vin[i]];
    if (val === undefined) return false;
    sum += val * weights[i];
  }
  const rem = sum % 11;
  const check = rem === 10 ? "X" : String(rem);
  return vin[8] === check;
}

// ✅ Save VIN (with validations + logs)
export const saveVIN = async (req, res) => {
  try {
    const { vin, surface, probability, location } = req.body;

    // 1) VIN required
    if (!vin) {
      return res.status(400).json({ ok: false, message: "VIN is required." });
    }

    // 2) Only metal surface allowed
    if (surface !== "metal") {
      return res.status(403).json({ ok: false, message: "Surface not metal. Not saved." });
    }

    // 3) VIN checksum validate
    if (!isValidVIN(vin)) {
      return res.status(422).json({ ok: false, message: "Invalid VIN checksum." });
    }

    // 4) Prevent duplicates
    let doc = await Vin.findOne({ vin });
    if (doc) {
      return res.status(200).json({ ok: true, message: "VIN already exists", id: doc._id });
    }

    // 5) Save in DB
    doc = new Vin({
      vin,
      surface,
      probability: typeof probability === "number" ? probability : null,
      location: location || null,
      userAgent: req.get("user-agent"),
      ip: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
    });

    await doc.save();

    return res.status(201).json({
      ok: true,
      message: "VIN saved successfully",
      id: doc._id,
    });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};
