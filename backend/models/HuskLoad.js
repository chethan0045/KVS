const mongoose = require('mongoose');
const { Schema } = mongoose;

const huskLoadSchema = new Schema({
  tonnage: { type: Number, required: true },
  price_per_ton: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  total_paid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  received_date: { type: Date, required: true },
  supplier_name: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('HuskLoad', huskLoadSchema);
