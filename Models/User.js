// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String, // For email/password login
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  otp: String,
  otpExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
