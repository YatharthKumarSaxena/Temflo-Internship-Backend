const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeCount: { type: Number, default: 0 },
  lastPayrollRun: { type: String, default: "Never" },
  createdBy: { type: String, required: true },
  status: { type: String, default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Batch", batchSchema);
