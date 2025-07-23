const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const router = express.Router();

// POST /signup
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: "Username already exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash });

  res.json({ message: "User created" });
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login request body:", req.body); // 👈 Debugging

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
