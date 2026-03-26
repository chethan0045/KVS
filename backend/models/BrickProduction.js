const mongoose = require('mongoose');
const { Schema } = mongoose;

const brickProductionSchema = new Schema({
  batch_number: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  production_date: { type: Date, required: true },
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, default: 'produced' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BrickProduction', brickProductionSchema);
