const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
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
  date: { type: Date },
  inTime: String,
  outTime: String,
  reason: String,
  status: { type: String, enum: ['present', 'absent', 'pending'], default: 'present' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
  
});

module.exports = mongoose.model('Attendance', AttendanceSchema);