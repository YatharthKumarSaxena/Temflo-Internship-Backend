const mongoose = require('mongoose');

const FinancialHeadingSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    statementCategory: { type: String, enum: ['Balance Sheet', 'P&L'], required: true },
    heading: {
      type: String,
      enum: ['Assets', 'Liabilities', 'Income', 'Expenditure'],
      required: true,
    },
    category: { type: String, default: '' },
    sequence: { type: Number, default: 0 },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

FinancialHeadingSchema.index(
  { companyId: 1, statementCategory: 1, heading: 1, category: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('FinancialHeading', FinancialHeadingSchema);
