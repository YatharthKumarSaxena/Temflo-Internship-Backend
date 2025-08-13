const mongoose = require('mongoose');

const CostProfitCenterSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },
  costProfitCode: {
    type: String,
    required: true,
    match: /^[0-9]{1,10}$/, // 1 to 10 digits
  },
  description: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('CostProfit', CostProfitCenterSchema);
