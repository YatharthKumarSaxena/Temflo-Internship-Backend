const mongoose = require('mongoose');

const SpecialGlIndicatorSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    indicator: { type: String, required: true, minlength: 2, maxlength: 2, uppercase: true },
    description: { type: String, default: '' },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SpecialGlIndicatorSchema.index(
  { companyId: 1, indicator: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('SpecialGlIndicator', SpecialGlIndicatorSchema);
