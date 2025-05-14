const mongoose = require('mongoose');

const AttendanceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   companyId: {
    type: String,
    required: true,
    immutable: true
  },
  plantId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Plant',
        required:true
  },
  date: Date,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AttendanceRequest', AttendanceRequestSchema);
