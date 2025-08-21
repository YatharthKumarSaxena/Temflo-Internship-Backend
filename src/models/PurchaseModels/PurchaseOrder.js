const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  lineItemNumber: {
    type: Number,
    required: true,
  },
  purchaseType: {
    type: String,
    enum: ['Material', 'Services', 'Own consumption', 'Capital goods'],
    required: true,
  },
  plant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true,
  },
  segment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: true,
  },
  costCentre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCentre',
    required: true,
  },
  materialCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // from material master
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  measurement: {
    type: String,
    required: true,
  },
  baseRate: {
    type: Number,
    required: true,
  },
  gstTaxCode: {
    type: String,
    required: true,
    // dropdown from financial accounting masters
  },
  gstTaxRate: {
    type: Number,
    required: true,
  },
  glAccount: {
    type: String,
    required: true,
    // auto/manual based on purchaseType, validate from GL master
  }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
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
  purchaseOrderNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{10}$/, // 10-digit PO number
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier', // from supplier master
    required: true,
  },
  purchasePeriodFrom: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        const year = value.getFullYear();
        const currentYear = new Date().getFullYear();
        return year === currentYear || year === currentYear - 1;
      },
      message: 'Purchase period from must be within the financial year.',
    }
  },
  purchasePeriodTo: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        const year = value.getFullYear();
        const currentYear = new Date().getFullYear();
        return year === currentYear || year === currentYear - 1;
      },
      message: 'Purchase period to must be within the financial year.',
    }
  },
  lineItems: {
    type: [lineItemSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0,
  }

}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
