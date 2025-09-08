const mongoose = require('mongoose');

const tdsCodeSchema = new mongoose.Schema(
  {
    tdsCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tdsRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Salary',
        'Professional Services',
        'Contractor',
        'Rent',
        'Interest',
        'Commission',
        'Other',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
tdsCodeSchema.index({ tdsCode: 1 });
tdsCodeSchema.index({ category: 1 });
tdsCodeSchema.index({ status: 1 });

module.exports = mongoose.model('TDSCode', tdsCodeSchema);
