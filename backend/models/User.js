const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  otp: { type: String },
  otp_expiry: { type: Date },
  is_verified: { type: Boolean, default: false },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
