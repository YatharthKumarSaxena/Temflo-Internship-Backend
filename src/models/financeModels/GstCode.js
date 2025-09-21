const mongoose = require('mongoose');

const GstCodeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    code: { type: String, required: true, minlength: 2, maxlength: 2, uppercase: true },
    nature: { type: String, enum: ['FULL', 'NIL', 'PROP'], required: true },
    rate: { type: Number, min: 0, max: 100, default: 0 },
    description: { type: String, default: '' },
    reconGl: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneralLedger' },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GstCodeSchema.index(
  { companyId: 1, code: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('GstCode', GstCodeSchema);
