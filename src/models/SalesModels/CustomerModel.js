const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    partyCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Make non-editable after creation
      default: function () {
        // Auto-generate 8-digit numeric code
        return Math.floor(10000000 + Math.random() * 90000000).toString();
      },
      validate: {
        validator: function (v) {
          return /^[0-9]{8}$/.test(v);
        },
        message: 'Party code must be an 8-digit numeric value',
      },
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    legalStatus: {
      type: String,
      required: true,
      enum: [
        'Individual',
        'Partnership',
        'AOP',
        'BOI',
        'Company',
        'LLP',
        'Proprietorship',
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
    mailId: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address',
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
    gstRegistered: {
      type: String,
      required: true,
      enum: ['Yes', 'No', 'Composite'],
      default: 'No',
    },
    gstin: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid GSTIN',
      },
    },
    msme: {
      type: Boolean,
      default: false,
    },
    msmeRegistrationNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return !this.msme; // allow empty if not MSME
          return /^UDYAM[A-Z]{4}\d{7}$/.test(String(v).toUpperCase());
        },
        message: "Enter a valid UDYAM Registration Number (format: 'UDYAM' + 4 letters + 7 digits)",
      },
    },
    exemptedForGst: {
      type: Boolean,
      default: false,
    },
    pan: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid PAN (format: ABCDE1234F)',
      },
    },
    tan: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid TAN (format: ABCD12345E)',
      },
    },
    reconCode: {
      type: String,
      required: false, // Made optional for now
      trim: true,
    },
    bankAccounts: [
      {
        accountNumber: {
          type: String,
          required: true,
          trim: true,
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
        branchName: {
          type: String,
          required: true,
          trim: true,
        },
        bankName: {
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
    uploadFile: {
      type: String, // Store file path
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
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: false, // Made optional for now
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
    // Maker-Checker fields
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
    makerChecker: {
      maker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    },
  },
  {
    timestamps: true,
  }
);

// Validation middleware for business rules
customerSchema.pre('save', async function (next) {
  try {
    // Rule 1: Only one customer code allowed per combination of PAN and GSTIN
    if (this.pan && this.gstin) {
      const existingCustomer = await this.constructor.findOne({
        pan: this.pan,
        gstin: this.gstin,
        _id: { $ne: this._id },
      });
      if (existingCustomer) {
        return next(
          new Error('Only one customer code is allowed per combination of PAN and GSTIN')
        );
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
        Partnership: 'P',
        AOP: 'A',
        BOI: 'B',
        Company: 'C',
        LLP: 'L',
        Trust: 'T',
        Society: 'S',
      };
      if (
        legalStatusMapping[this.legalStatus] &&
        panFourthDigit !== legalStatusMapping[this.legalStatus]
      ) {
        return next(
          new Error(
            `PAN 4th digit should be ${legalStatusMapping[this.legalStatus]} for ${
              this.legalStatus
            }`
          )
        );
      }
    }

    // Rule 5: GSTIN required when GST Registered is Yes/Composite
    if ((this.gstRegistered === 'Yes' || this.gstRegistered === 'Composite') && !this.gstin) {
      return next(new Error('GSTIN is required when GST Registered is Yes/Composite'));
    }

    // Rule 6: MSME registration number required when MSME is Yes
    if (this.msme && !this.msmeRegistrationNumber) {
      return next(new Error('MSME registration number is required when MSME is Yes'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Index for better query performance
customerSchema.index({ companyId: 1, plantId: 1 });
customerSchema.index({ pan: 1, gstin: 1 });
customerSchema.index({ partyCode: 1 });
customerSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model('Customer', customerSchema);
