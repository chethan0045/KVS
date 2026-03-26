const mongoose = require('mongoose');
const { Schema } = mongoose;

const kilnManufactureSchema = new Schema({
  kiln_loading_id: { type: Schema.Types.ObjectId, ref: 'KilnLoading', required: true },
  quantity_manufactured: { type: Number, required: true },
  quantity_damaged: { type: Number, default: 0 },
  manufacture_date: { type: Date, required: true },
  quality_grade: { type: String, default: 'A' },
  employees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  total_wages: { type: Number, default: 0 },
  status: { type: String, default: 'manufactured' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('KilnManufacture', kilnManufactureSchema);
