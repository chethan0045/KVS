const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  total_bricks_bought: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  total_paid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
