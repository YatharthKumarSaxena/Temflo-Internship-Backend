const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: String,
      required: true,
      immutable: true,
    },
    departmentCode: {
      type: String,
      required: true,
      match: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{1,6}$/,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', DepartmentSchema);
