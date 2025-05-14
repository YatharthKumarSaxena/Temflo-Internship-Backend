const mongoose = require('mongoose');

const AttendanceSettingsSchema = new mongoose.Schema({
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
  holidays: [
    {
      date: { type: Date, required: true },
      occasion: { type: String },
      type: { type: String, enum: ['National', 'Compulsory', 'Optional'], default: 'National' },
    }
  ],

  weeklyOffs: [{
  type: String,
  enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}]

});

module.exports = mongoose.model('AttendanceSettings', AttendanceSettingsSchema);
