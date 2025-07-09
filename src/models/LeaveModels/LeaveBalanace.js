// models/LeaveBalance.js
const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  companyId: {
    type: String,
    required: true,
    immutable: true
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'LeavePolicy'
  },
  leaveTypeName: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  availed:{
    type: Number,
    default: 0
  },
  lastCredited: {
    type: Date
  },
  lastCreditedPeriod: {
    type: String
  }
 
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
