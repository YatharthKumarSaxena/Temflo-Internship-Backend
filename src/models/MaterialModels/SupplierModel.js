const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Make non-editable after creation
      default: function () {
        // Auto-generate 8-digit numeric code
        return Math.floor(10000000 + Math.random() * 90000000).toString();
      },
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    legalStatus: {
      type: String,
      required: true,
      enum: [
        'Individual',
        'Proprietorship',
        'AOP',
        'BOI',
        'Company',
        'LLP',
        'Partnership',
        'Trust',
        'Society',
      ],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    stateCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    pinCode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Pin code must be 6 digits',
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Phone number must be 10 digits starting with 6-9',
      },
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address',
      },
    },
    gstRegistered: {
      type: String,
      required: true,
      enum: ['Yes', 'No', 'Composite'],
      default: 'No',
    },
    gstin: {
      type: String,
      required: function () {
        return this.gstRegistered === 'Yes' || this.gstRegistered === 'Composite';
      },
      immutable: true, // Make non-editable after creation
      validate: {
        validator: function (v) {
          if (!v) return this.gstRegistered === 'No'; // Allow empty for non-GST registered
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid GSTIN',
      },
    },
    pan: {
      type: String,
      required: true,
      immutable: true, // Make non-editable after creation
      validate: {
        validator: function (v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid PAN',
      },
    },
    tan: {
      type: String,
      immutable: true, // Make non-editable after creation
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid TAN',
      },
    },
    msmeRegistered: {
      type: Boolean,
      default: false,
    },
    msmeRegistrationNumber: {
      type: String,
      required: function () {
        return this.msmeRegistered === true;
      },
      trim: true,
    },
    reconCode: {
      type: String,
      required: true,
      default: function () {
        // Auto-generate from GL Config - placeholder for now
        return 'REC' + Math.floor(1000 + Math.random() * 9000).toString();
      },
    },
    bankAccounts: [
      {
        accountNumber: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^\d{9,18}$/.test(v);
            },
            message: 'Bank account number must be 9-18 digits',
          },
        },
        ifscCode: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
            },
            message: 'Please enter a valid IFSC code',
          },
        },
        bankName: {
          type: String,
          required: true,
          trim: true,
        },
        branchName: {
          type: String,
          required: true,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    documents: {
      panCard: {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
      gstinCertificate: {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
      bankDetails: {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
      msmeCertificate: {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
      others: [
        {
          fileName: String,
          fileUrl: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
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
        comments: String,
        approvedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Verification fields
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'partially_verified', 'not_required'],
      default: 'pending',
    },

    verificationDetails: {
      pan: {
        status: {
          type: String,
          enum: ['pending', 'verified', 'failed', 'not_required'],
          default: 'pending',
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        verificationData: mongoose.Schema.Types.Mixed,
        errorMessage: String,
        isManualOverride: {
          type: Boolean,
          default: false,
        },
      },
      tan: {
        status: {
          type: String,
          enum: ['pending', 'verified', 'failed', 'not_required'],
          default: 'pending',
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        verificationData: mongoose.Schema.Types.Mixed,
        errorMessage: String,
        isManualOverride: {
          type: Boolean,
          default: false,
        },
      },
      gstin: {
        status: {
          type: String,
          enum: ['pending', 'verified', 'failed', 'not_required'],
          default: 'pending',
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        verificationData: mongoose.Schema.Types.Mixed,
        errorMessage: String,
        isManualOverride: {
          type: Boolean,
          default: false,
        },
      },
      msme: {
        status: {
          type: String,
          enum: ['pending', 'verified', 'failed', 'not_required'],
          default: 'pending',
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        verificationData: mongoose.Schema.Types.Mixed,
        errorMessage: String,
        isManualOverride: {
          type: Boolean,
          default: false,
        },
      },
      bankAccounts: [
        {
          accountNumber: String,
          ifscCode: String,
          status: {
            type: String,
            enum: ['pending', 'verified', 'failed', 'not_required'],
            default: 'pending',
          },
          verifiedAt: Date,
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          verificationData: mongoose.Schema.Types.Mixed,
          errorMessage: String,
          isManualOverride: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },

    // Maker-Checker fields
    makerChecker: {
      maker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      checker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      checkerAssignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      checkerAssignedAt: Date,
      checkerComments: String,
      checkerAction: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      checkerActionAt: Date,
      allowMakerToSelectChecker: {
        type: Boolean,
        default: true,
      },
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
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

// Validation middleware for business rules
supplierSchema.pre('save', async function (next) {
  try {
    // Rule 1: Only one vendor code allowed per combination of PAN and GSTIN
    if (this.pan && this.gstin) {
      const existingSupplier = await this.constructor.findOne({
        pan: this.pan,
        gstin: this.gstin,
        _id: { $ne: this._id },
      });
      if (existingSupplier) {
        return next(new Error('Only one vendor code is allowed per combination of PAN and GSTIN'));
      }
    }

    // Rule 2: GSTIN digits 3-12 should equal PAN number
    if (this.gstin && this.pan) {
      const gstinPanPart = this.gstin.substring(2, 12); // digits 3-12 (0-indexed)
      if (gstinPanPart !== this.pan) {
        return next(new Error('GSTIN digits 3-12 should equal PAN number'));
      }
    }

    // Rule 3: GSTIN first 2 digits should match selected state code
    if (this.gstin && this.stateCode) {
      const gstinStateCode = this.gstin.substring(0, 2);
      if (gstinStateCode !== this.stateCode) {
        return next(new Error('GSTIN first 2 digits should match selected state code'));
      }
    }

    // Rule 4: PAN 4th digit should match legal status
    if (this.pan && this.legalStatus) {
      const panFourthDigit = this.pan.charAt(3);
      const legalStatusMapping = {
        Individual: 'P',
        Proprietorship: 'P',
        Partnership: 'F',
        Company: 'C',
        LLP: 'L',
        Trust: 'T',
        AOP: 'A',
        BOI: 'B',
        Society: 'S',
      };

      const expectedDigit = legalStatusMapping[this.legalStatus];
      if (expectedDigit && panFourthDigit !== expectedDigit) {
        return next(
          new Error(`PAN 4th digit should be '${expectedDigit}' for ${this.legalStatus}`)
        );
      }
    }

    // Ensure at least one bank account is marked as primary
    if (this.bankAccounts && this.bankAccounts.length > 0) {
      const hasPrimary = this.bankAccounts.some((account) => account.isPrimary);
      if (!hasPrimary) {
        this.bankAccounts[0].isPrimary = true;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Index for better query performance
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ gstin: 1 });
supplierSchema.index({ pan: 1 });
supplierSchema.index({ pan: 1, gstin: 1 }); // Compound index for uniqueness check

module.exports = mongoose.model('Supplier', supplierSchema);
