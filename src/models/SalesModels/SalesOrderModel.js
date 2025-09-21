const mongoose = require('mongoose');

const salesOrderLineItemSchema = new mongoose.Schema({
  lineItemNumber: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['Service', 'Material'],
    required: true,
  },
  materialCodeServiceCode: {
    type: String,
    required: true,
  },
  glNumber: {
    type: String,
    required: false,
  },
  materialDescription: {
    type: String,
    required: true,
  },
  hsnCode: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  measurement: {
    type: String,
    required: true,
  },
  baseRate: {
    type: Number,
    required: true,
    min: 0,
  },
  gstTaxRate: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const salesOrderSchema = new mongoose.Schema(
  {
    salesOrderNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: function () {
        // Auto-generate 10 digits + YEAR (e.g., XXXXXXXXXXYYYY)
        const year = new Date().getFullYear().toString();
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 random digits
        return `${randomDigits}${year}`;
      },
    },
    plant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: true,
    },
    segment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Segment',
      required: false,
    },
    salesParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    billToParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    freightBorneByUs: {
      type: Boolean,
      default: false,
    },
    salesPeriodFrom: {
      type: Date,
      required: true,
    },
    salesPeriodTo: {
      type: Date,
      required: true,
    },
    salesOrderType: {
      type: String,
      enum: ['Domestic', 'Export', 'SEZ'],
      required: true,
      default: 'Domestic',
    },
    currency: {
      type: String,
      required: true,
    },
    lineItems: [salesOrderLineItemSchema],
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected', 'active', 'inactive'],
      default: 'pending_approval',
    },
    deletionIndicator: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    entryDate: {
      type: Date,
      default: Date.now,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastChangeDate: {
      type: Date,
      default: Date.now,
    },
    lastChangeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Pre-save middleware for validation and auto-calculation
salesOrderSchema.pre('save', async function (next) {
  try {
    // Validate maximum line items limit
    if (this.lineItems && this.lineItems.length > 50) {
      return next(new Error('Maximum 50 line items allowed per sales order'));
    }

    // Auto-number line items
    this.lineItems.forEach((item, index) => {
      item.lineItemNumber = index + 1;
    });

    // Calculate tax amount for each line item
    this.lineItems.forEach((item) => {
      const taxableAmount = item.quantity * item.baseRate;
      item.taxAmount = (taxableAmount * item.gstTaxRate) / 100;
    });

    next();
  } catch (error) {
    next(error);
  }
});

// Index for better query performance
salesOrderSchema.index({ salesOrderNumber: 1 });
salesOrderSchema.index({ companyId: 1, plant: 1 });
salesOrderSchema.index({ salesParty: 1 });
salesOrderSchema.index({ status: 1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
