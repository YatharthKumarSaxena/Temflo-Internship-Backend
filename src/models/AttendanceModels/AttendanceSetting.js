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
  holidays: [
    {
      date: { type: Date, required: true },
      occasion: { type: String },
      type: { type: String, enum: ['National', 'Compulsory', 'Optional'], default: 'National' },
    }
  ]

});

module.exports = mongoose.model('AttendanceSettings', AttendanceSettingsSchema);
