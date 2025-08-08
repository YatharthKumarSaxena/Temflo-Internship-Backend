const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  companyId:{
        type: String,
        required: true,
        immutable: true }, 

  plantCode:{
    type: String,
    required: true,
    match: /^\d{4}$/, // 4 digit code
    immutable: true   // Not editable
  },
  businessArea:{
    type: mongoose.Schema.ObjectId, ref: 'BusinessArea',
    immutable: true,
    // required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  State: {
    type: String,
  },
  postalCode: {
    type: Number,
  },
  country: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email:{
    type:String
  },
  normalSEZ:{
    type:String,
  },

  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
});

schema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Plant', schema);
