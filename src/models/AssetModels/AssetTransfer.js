const mongoose = require('mongoose');

const AssetTransferSchema = new mongoose.Schema({
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
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Asset',
  },
  fromEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  toEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending',
  },
  reason: {
    type: String,
    required: true,
  },
  adminNotes: {
    type: String,
    default: '',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
AssetTransferSchema.index({ companyId: 1, plantId: 1, status: 1 });
AssetTransferSchema.index({ fromEmployee: 1, status: 1 });
AssetTransferSchema.index({ toEmployee: 1, status: 1 });
AssetTransferSchema.index({ assetId: 1, status: 1 });

module.exports = mongoose.model('AssetTransfer', AssetTransferSchema);
