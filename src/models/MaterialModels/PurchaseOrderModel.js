const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
  {
    poCode: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        // Auto-generate 10 digits + Year
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
        return `${randomNum}${year}`;
      },
    },
    plant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    purchasePeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    lineItems: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Material',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0.01,
        },
        basicCost: {
          type: Number,
          required: true,
          min: 0,
        },
        measurement: {
          type: String,
          required: true,
        },
        taxCode: {
          type: String,
          required: true,
        },
        gstRate: {
          type: Number,
          required: true,
          min: 0,
          max: 28,
        },
        useOfPurchase: {
          type: String,
          required: true,
          enum: ['Stock', 'Consumption', 'Capital'],
        },
        generalLedger: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
        totalAmount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'draft',
    },
    approvalHistory: [
      {
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        action: {
          type: String,
          enum: ['approved', 'rejected'],
        },
        comments: {
          type: String,
          trim: true,
        },
        approvedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
purchaseOrderSchema.index({ poCode: 1 });
purchaseOrderSchema.index({ plant: 1 });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ 'purchasePeriod.startDate': 1 });
purchaseOrderSchema.index({ 'purchasePeriod.endDate': 1 });
purchaseOrderSchema.index({ createdBy: 1 });

// Virtual for total line items
purchaseOrderSchema.virtual('totalLineItems').get(function () {
  return this.lineItems.length;
});

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function (next) {
  if (this.lineItems && this.lineItems.length > 0) {
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.basicCost * item.quantity, 0);
    this.gstAmount = this.lineItems.reduce((sum, item) => {
      const itemTotal = item.basicCost * item.quantity;
      return sum + (itemTotal * item.gstRate) / 100;
    }, 0);
    this.totalAmount = this.subtotal + this.gstAmount;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
