// models/Asset.js
const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  companyId: {
      type: String,
      required: true,
      immutable: true
    },
    plantId:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Plant'
  
    },
  name: { type: String, required: true },
  assetType: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetType', required: true },
  serialNumber: { type: String, unique: true },
  description: String,
  status: {
    type: String,
    enum: ['Available', 'Assigned', 'Under Maintenance', 'Disposed', 'Expired'],
    default: 'Available',
  },
  location:{ type:String},
  manufacturer:{type:String},
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  purchaseDate: Date,
  expiryDate: Date, 
  responsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Asset', AssetSchema);
