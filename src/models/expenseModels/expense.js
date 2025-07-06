const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

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

  category: { type: String, required: true },
  subCategory: { type: String, required: false },

  amount: {
    type: Number,
    required: true,
  },

  files: [
    {
      type: String, // Assuming you store file URLs (e.g. S3, Cloudinary)
      required: true,
    },
  ],

  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  }, // Flexible schema for dynamic fields

  submittedAt: {
    type: Date,
    default: Date.now,
  },

  lastModifiedAt: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ['under review', 'claimed', 'rejected'],
    default: 'under review',
  },

  approver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  comments: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model('Expense', ExpenseSchema);
