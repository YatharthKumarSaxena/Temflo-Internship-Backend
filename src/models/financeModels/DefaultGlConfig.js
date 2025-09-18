const mongoose = require('mongoose');

const DefaultGlConfigSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    module: { type: String, enum: ['MM', 'SD', 'FI', 'HR'], required: true },
    type: { type: String, required: true },
    subType: { type: String },
    glNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneralLedger', required: true },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DefaultGlConfigSchema.index(
  { companyId: 1, module: 1, type: 1, subType: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('DefaultGlConfig', DefaultGlConfigSchema);
