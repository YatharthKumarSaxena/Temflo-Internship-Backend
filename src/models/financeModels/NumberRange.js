const mongoose = require('mongoose');

const NumberRangeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, required: true },
    year: { type: String },
    from: { type: String, maxlength: 10 },
    to: { type: String, maxlength: 10 },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NumberRangeSchema.index(
  { companyId: 1, type: 1, year: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('NumberRange', NumberRangeSchema);
