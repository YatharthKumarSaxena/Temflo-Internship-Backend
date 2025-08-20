const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    match: /^\d{9,18}$/, // Basic validation for Indian account numbers
  },
  ifsc: {
    type: String,
    required: true,
    match: /^[A-Z]{4}0[A-Z0-9]{6}$/, // IFSC code format (e.g., SBIN0001234)
  },
  branchName: {
    type: String,
    required: true,
  }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    panCard: {
      type: String, // URL or file path
      required: false,
    },
    gstinCertificate: {
      type: String,
      required: false,
    },
    bankDetails: {
      type: String,
      required: false,
    },
    msmeCertificate: {
      type: String,
      required: false,
    },
    others: {
      type: String,
      required: false,
    }
  }, { _id: false });
  
const supplierSchema = new mongoose.Schema({
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
  supplierCode: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{8}$/, // 8-digit numeric
  },
  supplierName: {
    type: String,
    required: true,
  },
  legalStatus: {
    type: String,
    enum: ['Individual', 'Partnership', 'AOP', 'BOI', 'Company', 'LLP', 'Others'],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
    // You can further validate against a list of GST state codes if needed
  },
  country: {
    type: String,
    required: true,
    default: 'India', // assuming default if most are Indian suppliers
  },
  pinCode: {
    type: String,
    required: true,
    match: /^[1-9][0-9]{5}$/, // Indian PIN Code
    // You can validate against a master list in your service logic
  },
  mailId: {
    type: String,
    required: true,
    match: /^\S+@\S+\.\S+$/, // basic email format
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/, // 10-digit phone number
  },
  gstRegistered: {
    type: String,
    enum: ['Yes', 'No', 'Composite'],
    required: true,
  },
  gstin: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.gstRegistered === 'Yes' || this.gstRegistered === 'Composite') {
          return /^[0-9A-Z]{15}$/.test(v);
        }
        return true; // allowed to be empty if not GST registered
      },
      message: 'GSTIN should be 15 characters (uppercase alphanumeric)',
    },
  },
  msme: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  msmeRegistrationNumber: {
    type: String,
    required: function () {
      return this.msme === 'Yes';
    },
  },
  pan: {
    type: String,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // standard PAN format
  },
  tan: {
    type: String,
  },
  reconCode: {
    type: String,
    required: true, // assumed auto from GL Config
  },
  bankAccounts: {
    type: [bankAccountSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  documents: {
    type: documentSchema,
    default: {}
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Supplier', supplierSchema);
