const { required } = require('joi');
const mongoose = require('mongoose');

const BusinessAreaSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },

  businessArea: {
    type: String,
    required: true,
    match: /^\d{4}$/,
    immutable: true, // Not editable
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  gstinNumber: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'GstinNumber',
  },
});

module.exports = mongoose.model('BusinessArea', BusinessAreaSchema);
