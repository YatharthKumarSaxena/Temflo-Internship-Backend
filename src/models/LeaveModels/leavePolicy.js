// models/LeavePolicy.js
const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    immutable: true
  },
  name: {
    type: String,
    required: true, // e.g. "Casual", "Sick"
  },
  count: {
    type: Number,
    required: true // Number of days to credit each period
  },
  frequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  creditDay: {
    type: Number, // Day of month (e.g. 30), or day of quarter start (e.g. 1)
    default: 1
  },
  expiryType: {
    type: String,
    enum: ['never', 'end_of_month', 'end_of_quarter', 'end_of_year', 'custom'],
    default: 'end_of_year'
  },
  expiryDate: {
    type: Date, // used if expiryType = custom
  },
  isActive: {
    type: Boolean,
    default: true
  },
   creditOnCreation:{
    type:Boolean,
    default:false
  }
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
