const mongoose = require('mongoose');
const { Schema } = mongoose;

const kilnLoadingSchema = new Schema({
  kiln_number: { type: String, required: true },
  quantity_loaded: { type: Number, required: true },
  employees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  loading_date: { type: Date, required: true },
  status: { type: String, default: 'loading' },
  quantity_sold: { type: Number, default: 0 },
  // Rs per brick, captured from WageSetting at creation; legacy records default to 0.60
  wage_rate: { type: Number, default: 0.60 },
  total_wages: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('KilnLoading', kilnLoadingSchema);
