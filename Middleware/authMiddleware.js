import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

// In-memory OTP storage (for demo purposes; use Redis or DB in production)
const otpStore = new Map();

// ✅ Send OTP Middleware
export const loginWithOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expiry });

    console.log(`📩 OTP for ${email}: ${otp}`); // TODO: Send via email/SMS in production

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Verify OTP and generate JWT
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ message: "OTP expired or not found" });

    if (stored.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > stored.expiry) return res.status(400).json({ message: "OTP expired" });

    otpStore.delete(email); // Remove OTP after verification

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Middleware to protect routes (JWT verification)
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-otp -otpExpires');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ✅ Get current logged-in user
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
