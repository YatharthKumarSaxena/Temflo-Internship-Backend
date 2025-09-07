const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    materialCode: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        // Auto-generate 6-digit numeric code
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    hsnCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HSNCode',
      required: true,
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
      enum: ['RM', 'FG', 'WIP', 'Service', 'Capital', 'Consumable'],
    },
    subCategory: {
      type: String,
      required: function () {
        return ['RM', 'FG', 'WIP'].includes(this.category);
      },
      trim: true,
    },
    measurement: {
      type: String,
      required: true,
      enum: [
        'EA',
        'KG',
        'TO',
        'QT',
        'LT',
        'MT',
        'FT',
        'M',
        'BOX',
        'PCS',
        'SET',
        'PAIR',
        'ROLL',
        'METER',
      ],
    },
    basicCost: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      type: String,
      trim: true,
    },
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      default: 0,
      min: 0,
    },
    leadTime: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Lead time in days',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
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
materialSchema.index({ materialCode: 1 });
materialSchema.index({ materialName: 1 });
materialSchema.index({ hsnCode: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ status: 1 });

module.exports = mongoose.model('Material', materialSchema);
