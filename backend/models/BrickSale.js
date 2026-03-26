const mongoose = require('mongoose');
const { Schema } = mongoose;

const brickSaleSchema = new Schema({
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  kiln_loading_id: { type: Schema.Types.ObjectId, ref: 'KilnLoading' },
  quantity_sold: { type: Number, required: true },
  price_per_brick: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  sale_date: { type: Date, required: true },
  driver_id: { type: Schema.Types.ObjectId, ref: 'Employee' },
  helper_id: { type: Schema.Types.ObjectId, ref: 'Employee' },
  driver_wage: { type: Number, default: 750 },
  helper_wage: { type: Number, default: 500 },
  payment_status: { type: String, default: 'pending' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BrickSale', brickSaleSchema);
