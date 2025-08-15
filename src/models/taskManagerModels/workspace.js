const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    plantId: {
      //6896280424313307dcdf5d9a
      type: mongoose.Schema.ObjectId,
      ref: 'Plant',
      required: true,
    },
    createdBy: {
      //6817260aad9e57ab8fce2959
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
    // project: [{
    //   type: mongoose.Types.ObjectId,
    //   ref: 'Project'
    // }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workspace', workspaceSchema);
