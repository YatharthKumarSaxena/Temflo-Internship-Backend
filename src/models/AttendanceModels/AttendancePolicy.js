const mongoose = require('mongoose');

const AttendancePolicySchema = new mongoose.Schema({
 
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
  name:{
    type: String,
    required: true
  },  
  isLocationBased: { type: Boolean, default: true },
  isApprovalRequired: { type: Boolean, default: false },
  isMarkingEnabled: { type: Boolean, default: true },
  inTime: String,
  outTime: String,
  avgHours: Number,
  location: {
    latitude: Number,
    longitude: Number,
    radius: Number // in meters
  },
  workingHours: {
    start: { type: String }, // e.g., "09:00"
    end: { type: String },   // e.g., "18:00"
    minHoursRequired: { type: Number }, // e.g., 8
  },
  weeklyOffs: [{
  type: String,
  enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
   }],
   remote: [{
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }]

});

module.exports = mongoose.model('AttendancePolicy', AttendancePolicySchema);
