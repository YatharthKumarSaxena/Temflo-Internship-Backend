const mongoose = require('mongoose');
const PlantMapping = require('../appModels/PlantMapping');

const purchaseOrderSchema = new mongoose.Schema(
  {
    poCode: {
      type: String,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 10,
      match: [/^\d{10}$/, 'Purchase Order code must be exactly 10 digits'],
      default: function () {
        // Auto-generate exactly 10-digit numeric code
        const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
        return String(randomNum);
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
      required: false,
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
        lineNumber: {
          type: Number,
          required: true,
        },
        purchaseType: {
          type: String,
          required: true,
          enum: ['Material', 'Services', 'Own consumption', 'Capital goods'],
        },
        segment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BusinessSegment',
          required: true,
        },
        costCentre: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CostProfitCenter',
          required: true,
        },
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Material',
          required: false,
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
          required: function () {
            return this.purchaseType === 'Own consumption' || this.purchaseType === 'Capital goods';
          },
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

// Pre-save middleware for validation
purchaseOrderSchema.pre('save', async function (next) {
  try {
    // Validate maximum line items limit
    if (this.lineItems && this.lineItems.length > 50) {
      return next(new Error('Maximum 50 line items allowed per purchase order'));
    }

    // Validate financial year for purchase period
    const startDate = this.purchasePeriod.startDate;
    const endDate = this.purchasePeriod.endDate;

    // Get company's financial year setting
    const User = mongoose.model('User');
    const company = await User.findOne({ companyId: this.createdBy?.companyId || this.companyId });

    if (company && company.year === 'Financial') {
      const currentYear = new Date().getFullYear();
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      // Financial year validation (April to March)
      if (startDate.getMonth() >= 3) {
        // April onwards
        if (startYear !== currentYear || endYear !== currentYear) {
          return next(new Error('Purchase period must be within current financial year'));
        }
      } else {
        // January to March
        if (startYear !== currentYear || endYear !== currentYear) {
          return next(new Error('Purchase period must be within current financial year'));
        }
      }
    }

    // Validate Plant-Segment-Cost Centre mapping
    for (const lineItem of this.lineItems) {
      const mapping = await PlantMapping.findOne({
        plantId: this.plant,
        segmentId: lineItem.segment,
        costCentreId: lineItem.costCentre,
        enabled: true,
      });

      if (!mapping) {
        return next(
          new Error(
            `Invalid combination: Plant, Segment, and Cost Centre must be mapped in company master`
          )
        );
      }
    }

    // Auto-number line items
    this.lineItems.forEach((item, index) => {
      item.lineNumber = index + 1;
    });

    next();
  } catch (error) {
    next(error);
  }
});

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
