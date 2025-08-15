const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    emoji: {
      type: String,
      required: false,
      trim: true,
      default: '📊',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    plantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plant',
      required: true,
    },

    links: [String],
    tags: [String],
    removed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
