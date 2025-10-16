const mongoose = require("mongoose");

const AdvanceLoanSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserWithBatch", // link to employee with batch
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch", // payroll batch
      required: true,
    },
    amount: { type: Number, required: true },
    paidDate: { type: Date, required: true },
    scheduleMonth: { type: Number, required: true }, // 1-12
    scheduleYear: { type: Number, required: true },
    transactionNo: { type: String },
    payrollDeduction: { type: Number, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Active", "Closed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdvanceLoan", AdvanceLoanSchema);
