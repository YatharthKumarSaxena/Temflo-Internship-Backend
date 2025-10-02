const mongoose = require('mongoose');

const DepartmentAssignmentSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  companyId: {
    type: String,
    required: true,
    immutable: true,
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true,
  },
  mainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of plant and department
DepartmentAssignmentSchema.index({ plantId: 1, mainId: 1 }, { unique: true });
DepartmentAssignmentSchema.index({ companyId: 1 });

module.exports = mongoose.model('DepartmentAssignment', DepartmentAssignmentSchema);
