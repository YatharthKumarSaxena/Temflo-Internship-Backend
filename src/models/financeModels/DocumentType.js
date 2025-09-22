const mongoose = require('mongoose');

const DocumentTypeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    description: { type: String, default: '' },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DocumentTypeSchema.index(
  { companyId: 1, type: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('DocumentType', DocumentTypeSchema);
