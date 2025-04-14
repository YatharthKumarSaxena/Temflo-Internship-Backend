const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  code: {
    type: String,
    required: true,
    match: /^\d{4}$/, // 4 digit code
    immutable: true   // Not editable
  },
  name: {
    type: String,
    required: true,
    immutable: true   // Not editable
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  pinCode: {
    type: String,
    validate: {
      validator: function (val) {
        // Use master list or regex pattern, placeholder below
        return /^\d{6}$/.test(val);
      },
      required:true,
      message: 'Invalid pin code'
    }
  },
  phoneNumber: {
    type: String,
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    required:true
  },
  isDetailUpdated:{
    type: Boolean,
    default: false,
  },
  legalStatus: {
    type: String,
  },
  tan: {
    type: String,
  },
  pan: {
    type: String,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  },
  year: {
    type: String,
    enum: ['Financial', 'Calendar'],
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner'],
  },
  
 
});

module.exports = mongoose.model('Admin', adminSchema);
