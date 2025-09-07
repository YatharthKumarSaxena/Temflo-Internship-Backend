const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        // Auto-generate 6-digit numeric code
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    legalStatus: {
      type: String,
      required: true,
      enum: [
        'Individual',
        'Proprietorship',
        'AOP',
        'BOI',
        'Company',
        'LLP',
        'Partnership',
        'Trust',
        'Society',
      ],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    pinCode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Pin code must be 6 digits',
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Phone number must be 10 digits starting with 6-9',
      },
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address',
      },
    },
    gstin: {
      type: String,
      required: function () {
        return this.legalStatus !== 'Individual';
      },
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty for individuals
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid GSTIN',
      },
    },
    pan: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid PAN',
      },
    },
    tan: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid TAN',
      },
    },
    bankAccountNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{9,18}$/.test(v);
        },
        message: 'Bank account number must be 9-18 digits',
      },
    },
    ifscCode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Please enter a valid IFSC code',
      },
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ gstin: 1 });
supplierSchema.index({ pan: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
