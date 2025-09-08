const mongoose = require('mongoose');

const CostProfitCenterSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
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
    immutable: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
CostProfitCenterSchema.index({ costProfitCode: 1 });
CostProfitCenterSchema.index({ companyId: 1 });

module.exports = mongoose.model('CostProfitCenter', CostProfitCenterSchema);
