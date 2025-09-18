const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema(
  {
    hsnCode: {
      type: String,
      required: true,
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
    companyId: {
      type: String,
      required: true,
      immutable: true,
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

// Compound index for HSN code and company to support validity period validation
hsnCodeSchema.index({ hsnCode: 1, companyId: 1 });

// Add validity period fields (fromDate/toDate)
hsnCodeSchema.add({
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
    default: () => new Date('9999-12-31T00:00:00.000Z'),
  },
});

// Pre-save middleware to validate overlapping validity periods
hsnCodeSchema.pre('save', async function (next) {
  // Only validate if hsnCode, fromDate, or toDate is modified
  if (this.isModified('hsnCode') || this.isModified('fromDate') || this.isModified('toDate')) {
    const HSNCode = mongoose.model('HSNCode');

    // Find existing HSN codes with the same hsnCode and companyId
    const existingHSNCodes = await HSNCode.find({
      hsnCode: this.hsnCode,
      companyId: this.companyId,
      _id: { $ne: this._id }, // Exclude current document if updating
    });

    // Check for overlapping validity periods
    for (const existingHSN of existingHSNCodes) {
      const newFromDate = new Date(this.fromDate);
      const newToDate = new Date(this.toDate);
      const existingFromDate = new Date(existingHSN.fromDate);
      const existingToDate = new Date(existingHSN.toDate);

      // Check if periods overlap
      // Two periods overlap if: newFromDate <= existingToDate AND newToDate >= existingFromDate
      if (newFromDate <= existingToDate && newToDate >= existingFromDate) {
        return next(
          new Error(
            `HSN Code ${this.hsnCode} already exists with overlapping validity period. ` +
              `Existing period: ${existingFromDate.toISOString().split('T')[0]} to ${
                existingToDate.toISOString().split('T')[0]
              }. ` +
              `New period: ${newFromDate.toISOString().split('T')[0]} to ${
                newToDate.toISOString().split('T')[0]
              }`
          )
        );
      }
    }
  }
  next();
});

module.exports = mongoose.model('HSNCode', hsnCodeSchema);
