const mongoose = require('mongoose');

const GlSubHeadingSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    category: {
      type: String,
      enum: ['Assets', 'Liabilities', 'Income', 'Expenditure'],
      required: true,
    },
    subHeading: { type: String, required: true },
    description: { type: String, default: '' },
    sequence: { type: Number, default: 0 },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GlSubHeadingSchema.index(
  { companyId: 1, category: 1, subHeading: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('GlSubHeading', GlSubHeadingSchema);
