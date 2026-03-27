const mongoose = require('mongoose');
const { Schema } = mongoose;

const archiveSchema = new Schema({
  kiln_number: { type: String, required: true },
  archived_date: { type: Date, default: Date.now },
  kiln_loading: { type: Object },
  manufactures: [{ type: Object }],
  sales: [{ type: Object }],
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Archive', archiveSchema);
