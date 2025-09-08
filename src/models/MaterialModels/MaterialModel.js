const mongoose = require('mongoose');
const GeneralLedger = require('./GeneralLedgerModel');

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
      enum: ['Service', 'Material'],
    },
    subCategory: {
      type: String,
      required: function () {
        return this.category === 'Material';
      },
      enum: ['RM', 'FG', 'WIP'],
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
        'HOURS',
      ],
      validate: {
        validator: function (v) {
          if (this.category === 'Service') {
            return ['EA', 'HOURS'].includes(v);
          }
          return true;
        },
        message: 'For services, measurement must be either EA or HOURS',
      },
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
    reconGL: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneralLedger',
      required: false, // Will be auto-assigned in controller
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

// Pre-save middleware to validate HSN code based on category and auto-assign reconGL
materialSchema.pre('save', async function (next) {
  // Auto-assign reconGL if not provided
  if (!this.reconGL) {
    let glAccount;

    if (this.category === 'Service') {
      glAccount = await GeneralLedger.findOne({
        accountName: { $regex: 'Service Revenue', $options: 'i' },
        isActive: true,
      });
    } else if (this.category === 'Material') {
      glAccount = await GeneralLedger.findOne({
        accountName: { $regex: 'Inventory', $options: 'i' },
        isActive: true,
      });
    }

    // Fallback to any active GL account
    if (!glAccount) {
      glAccount = await GeneralLedger.findOne({ isActive: true });
    }

    if (glAccount) {
      this.reconGL = glAccount._id;
    } else {
      return next(new Error('No General Ledger accounts found. Please create GL accounts first.'));
    }
  }

  // Validate HSN code based on category
  if (this.isModified('hsnCode') || this.isModified('category')) {
    const HSNCode = mongoose.model('HSNCode');
    const hsnCode = await HSNCode.findById(this.hsnCode);

    if (hsnCode) {
      if (this.category === 'Service' && !hsnCode.hsnCode.startsWith('99')) {
        return next(new Error('For services, HSN code must start with 99'));
      }
      if (this.category === 'Material' && hsnCode.hsnCode.startsWith('99')) {
        return next(new Error('For materials, HSN code must not start with 99'));
      }
    }
  }
  next();
});

// Index for better query performance
materialSchema.index({ materialCode: 1 });
materialSchema.index({ materialName: 1 });
materialSchema.index({ hsnCode: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ status: 1 });

module.exports = mongoose.model('Material', materialSchema);
