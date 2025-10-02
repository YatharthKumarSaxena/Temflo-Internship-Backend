const mongoose = require('mongoose');

const TdsCodeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    sectionCode: { type: String, required: true, minlength: 4, maxlength: 4, uppercase: true },
    act: { type: String, enum: ['Income Tax', 'GST', 'Labour Cess'], required: true },
    rate: { type: Number, min: 0, max: 100, default: 0 },
    reconGl: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneralLedger' },
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TdsCodeSchema.index(
  { companyId: 1, sectionCode: 1 },
  { unique: true, partialFilterExpression: { removed: false } }
);

module.exports = mongoose.model('TdsCode', TdsCodeSchema);
