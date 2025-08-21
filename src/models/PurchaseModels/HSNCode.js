const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema({
  companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plant',
  },
  hsnCode: {
    type: String,
    required: true,
    unique: true,
    // You can apply custom format validation here if needed
  },
  description: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100, // assuming percentage between 0–100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HSNCode', hsnCodeSchema);
