// models/AssetType.js
const mongoose = require('mongoose');

const AssetTypeSchema = new mongoose.Schema({
    companyId: {
      type: String,
      required: true,
      immutable: true
    },
  name: { type: String, required: true, unique: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AssetType', AssetTypeSchema);
