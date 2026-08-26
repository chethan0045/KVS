const mongoose = require('mongoose');
const { Schema } = mongoose;

// Single-document collection holding all configurable wage rates.
// Rates are captured onto records at creation time, so changing a rate
// here only affects records created afterwards - history stays intact.
const wageSettingSchema = new Schema({
  production_rate: { type: Number, default: 1.2 },     // Rs per brick produced
  kiln_loading_rate: { type: Number, default: 0.60 },  // Rs per brick loaded into kiln
  driver_wage: { type: Number, default: 750 },         // Rs flat per sale trip
  helper_wage: { type: Number, default: 500 },         // Rs flat per sale trip
  // Flat wage per kiln work record, by work type
  husk_loading_wage: { type: Number, default: 0 },
  dba_wage: { type: Number, default: 0 },
  wall_wage: { type: Number, default: 0 },
  cleaning_wage: { type: Number, default: 0 }
}, { timestamps: true });

wageSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('WageSetting', wageSettingSchema);
