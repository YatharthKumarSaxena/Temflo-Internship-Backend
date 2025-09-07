const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema(
  {
    hsnCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{2,8}$/.test(v);
        },
        message: 'HSN code must be 2-8 digits',
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    gstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 28,
    },
    category: {
      type: String,
      required: true,
      enum: ['Goods', 'Services'],
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
hsnCodeSchema.index({ hsnCode: 1 });
hsnCodeSchema.index({ description: 1 });
hsnCodeSchema.index({ category: 1 });
hsnCodeSchema.index({ status: 1 });

module.exports = mongoose.model('HSNCode', hsnCodeSchema);
