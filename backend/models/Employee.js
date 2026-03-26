const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  status: { type: String, default: 'active' },
  joining_date: { type: Date, required: true },
  total_wages_earned: { type: Number, default: 0 },
  total_paid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
