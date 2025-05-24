// models/LeaveRequest.js
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
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
  plantId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Plant'

  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'LeavePolicy'
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String
  },
  durationType:{
    type: String
  },
  daysRequested:{
   type:Number
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  decisionDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
