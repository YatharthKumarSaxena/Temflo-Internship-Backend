const mongoose = require('mongoose');

const BusinessSegmentSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },
  segmentCode: {
    type: String,
    required: true,
    match: /^[0-9]{1,6}$/, // allows only 1 to 6 digits
  },
  description: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('BusinessSegment', BusinessSegmentSchema);
