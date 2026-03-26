const mongoose = require('mongoose');
const { Schema } = mongoose;

const wagePaymentSchema = new Schema({
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  paid_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WagePayment', wagePaymentSchema);
