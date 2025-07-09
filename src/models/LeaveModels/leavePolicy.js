const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    immutable: true
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Plant'
  },
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 0.1 // ✅ Accepts fractional leave like 0.5
  },
  credit: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    customDates: [{
      type: Date
    }]
  },
  expiry: {
    frequency: {
      type: String,
      enum: ['never', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    customDate: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  creditOnCreation: {
    type: Boolean,
    default: false
  },
  isAdvanceAllowed: {
    type: Boolean,
    default: false
  },
  applyToAll: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
