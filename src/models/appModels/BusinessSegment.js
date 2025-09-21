const mongoose = require('mongoose');

const BusinessSegmentSchema = new mongoose.Schema({
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
  segmentCode: {
    type: String,
    required: true,
    match: /^[A-Za-z0-9]{1,5}$/,
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
BusinessSegmentSchema.index({ segmentCode: 1 });
BusinessSegmentSchema.index({ companyId: 1 });

module.exports = mongoose.model('BusinessSegment', BusinessSegmentSchema);
