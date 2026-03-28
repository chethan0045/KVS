const mongoose = require('mongoose');
const { Schema } = mongoose;

const brickProductionSchema = new Schema({
  batch_number: { type: String },
  quantity: { type: Number, required: true },
  sections: [{
    section_no: { type: String },
    entries: [{ a: Number, b: Number, value: Number }]
  }],
  production_date: { type: Date, required: true },
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, default: 'produced' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BrickProduction', brickProductionSchema);
