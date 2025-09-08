const { required } = require('joi');
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
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
    // workspaceId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Workspace',
    // },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    activityBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    types: {
      type: String,
      required: true,
      enum: ['Started', 'Completed', 'In Progress', 'Commented', 'Bug', 'Assigned']
    },
    text: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
