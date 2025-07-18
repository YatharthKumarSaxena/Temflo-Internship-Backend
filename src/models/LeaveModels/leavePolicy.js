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
  type: {
    type: String,
    enum: ['leave', 'wfh'],
    default: 'leave',
    required: true
  },

  count: {
    type: Number,
    min: 0.1,
    validate: {
      validator: function (v) {
        return this.type === 'wfh' ? true : v !== undefined;
      },
      message: 'Count is required for Leave type'
    }
  },

  credit: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'custom'],
      validate: {
        validator: function (v) {
          return this.type === 'wfh' ? true : v !== undefined;
        },
        message: 'Credit frequency is required for Leave type'
      }
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
      validate: {
        validator: function (v) {
          return this.type === 'wfh' ? true : v !== undefined;
        },
        message: 'Expiry frequency is required for Leave type'
      }
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    customDate: {
      type: Date
    },
    expireRatio: {
      type: Number,
      default: 1,
      validate: {
        validator: function (v) {
          // Only validate if type is NOT 'WFH'
          if (this.type === 'wfh') return true;
          return v > 0 && v <= 1;
        },
        message: 'Expire ratio must be between 0 (exclusive) and 1 (inclusive)'
      }
    }
  },

  isAdvanceAllowed: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
