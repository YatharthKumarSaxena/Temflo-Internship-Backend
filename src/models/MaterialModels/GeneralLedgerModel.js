const mongoose = require('mongoose');

const generalLedgerSchema = new mongoose.Schema(
  {
    accountCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Current Assets',
        'Fixed Assets',
        'Current Liabilities',
        'Long-term Liabilities',
        'Equity',
        'Revenue',
        'Cost of Goods Sold',
        'Operating Expenses',
        'Other Income',
        'Other Expenses',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
generalLedgerSchema.index({ accountCode: 1 });
generalLedgerSchema.index({ accountName: 1 });
generalLedgerSchema.index({ accountType: 1 });
generalLedgerSchema.index({ category: 1 });

module.exports = mongoose.model('GeneralLedger', generalLedgerSchema);
