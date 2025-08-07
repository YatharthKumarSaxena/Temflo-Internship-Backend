const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletTransactionSchema = new Schema({
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

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },

  transactionType: {
    type: String,
    enum: ['credit', 'debit', 'adjustment'],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
    min: 0,
  },

  balanceBefore: {
    type: Number,
    required: true,
  },

  balanceAfter: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  relatedExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: function () {
      return this.transactionType === 'debit';
    },
  },

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  },

  requestMessage: {
    type: String,
    required: function () {
      return this.transactionType === 'credit' && this.status === 'pending';
    },
  },

  adminNotes: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  processedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
WalletTransactionSchema.index({ employeeId: 1, createdAt: -1 });
WalletTransactionSchema.index({ companyId: 1, plantId: 1 });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
