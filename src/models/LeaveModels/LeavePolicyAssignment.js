const mongoose = require('mongoose');

const leavePolicyAssignmentSchema = new mongoose.Schema({
  leavePolicyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeavePolicy',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  plantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plant',
    },
}, { timestamps: true });

leavePolicyAssignmentSchema.index({ leavePolicyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('LeavePolicyAssignment', leavePolicyAssignmentSchema);
