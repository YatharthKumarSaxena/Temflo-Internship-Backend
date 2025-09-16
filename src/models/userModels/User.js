const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },
  plantId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Plant',
    required: function () {
      return this.role === 'employee';
    },
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Enter Email Address'],
    trim: true,
  },
  employeeCode: {
    type: String,
    minlength: 4,
    maxlength: 15,
    trim: true,
    required: function () {
      return this.role === 'employee';
    },
  },
  supervisor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  mobile: {
    type: Number,
    minlength: 10,
    maxlength: 13,
    required: function () {
      return this.role === 'employee';
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  team: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
  ],
  leadTeam: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
  ],
  image: {
    type: String,
    required: false,
    default: 'user.png',
  },
  name: {
    type: String,
    trim: true,
  },
  employeeInfo: {
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dob: { type: Date },
    emailPersonal: { type: String, trim: true },
    department: { type: String, trim: true },
    dateOfJoining: { type: Date },
    designation: { type: String, trim: true },
  },
  cAddress: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
  },
  city: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
  },
  state: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
  },
  country: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
  },
  pinCode: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
    validate: {
      validator: function (val) {
        return /^\d{6}$/.test(val);
      },
      message: 'Invalid pin code',
    },
  },
  phoneNumber: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
  },
  emergencyContact: {
    name: String,
    address: String,
    number: String,
    email: String,
  },
  degreeInfo: [
    {
      degree: String,
      institute: String,
      year: String,
      percentage: String,
      document: String,
      key: String,
    },
  ],
  address: {
    permanentAddress: {
      address: String,
      country: String,
      state: String,
      city: String,
    },
    presentAddress: {
      address: String,
      country: String,
      state: String,
      city: String,
    },
  },
  experience: [
    {
      company: String,
      position: String,
      dateOfEntry: String,
      dateOfExit: String,
      document: String,
      key: String,
    },
  ],
  bankDetail: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountType: String,
    accountHolder: String,
    document: String,
  },
  panaddhar: {
    panCard: String,
    aadharCard: String,
  },
  isDetailUpdated: {
    type: Boolean,
    default: false,
  },
  legalStatus: {
    type: String,
  },
  cin: {
    type: String,
    minlength: 21,
    maxlength: 21,
    match: /^[A-Za-z0-9]{21}$/,
    required: function () {
      return this.legalStatus === 'C';
    },
  },
  tan: {
    type: String,
  },
  pan: {
    type: String,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  },
  msmeRegistered: {
    type: Boolean,
    default: false,
  },
  msmeNumber: {
    type: String,
    match: /^\d{19}$/,
    required: function () {
      return this.msmeRegistered === true;
    },
  },
  year: {
    type: String,
    enum: ['Financial', 'Calendar'],
  },
  // Optional financial year period like "2025-2026" or start year "2025"
  financialYear: {
    type: String,
    match: /^\d{4}(-\d{4})?$/,
    required: false,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  code: {
    type: String,
    match: /^[A-Za-z\d]{4}$/,
    immutable: true,
    required: function () {
      return this.role === 'admin' || this.role === 'owner';
    },
  },
  permissions: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'employee'],
    default: 'owner',
  },

  // Wallet Balance for Expense Management
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },

  walletStatus: {
    type: String,
    enum: ['active', 'suspended', 'pending_request'],
    default: 'active',
  },

  lastWalletUpdate: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('validate', async function (next) {
  if (!this.companyId) {
    const { nanoid } = await import('nanoid');
    let newCompanyId;
    let exists = true;

    while (exists) {
      newCompanyId = nanoid(12);
      const existingUser = await mongoose.models.User.findOne({ companyId: newCompanyId });
      exists = !!existingUser;
    }

    this.companyId = newCompanyId;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
