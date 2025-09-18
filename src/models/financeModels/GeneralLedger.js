const mongoose = require('mongoose');

const GeneralLedgerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    glNumber: { type: String, required: true, length: 10 },
    subHeading: { type: mongoose.Schema.Types.ObjectId, ref: 'GlSubHeading', required: true },
    description: { type: String, default: '' },
    openItemManagement: { type: Boolean, default: false },
    reconGlType: { type: Boolean, default: false },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GeneralLedgerSchema.index(
  { companyId: 1, glNumber: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports =
  mongoose.models.GeneralLedger || mongoose.model('GeneralLedger', GeneralLedgerSchema);
