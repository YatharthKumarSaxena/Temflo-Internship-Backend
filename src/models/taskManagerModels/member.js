const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // taskId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Task',
    // },
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Member', memberSchema);
