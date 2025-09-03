const mongoose = require("mongoose");

const deductionSchema = new mongoose.Schema(
  {
    deductionName: { type: String, required: true },
    deductionCode: { type: String, required: true },
    type: { type: String, enum: ["percentage", "fixed", "custom"], required: true },

    // Percentage type fields
    percentageValue: { type: Number },
    percentageField: { type: String, enum: ["basicPay", "grossPay"] },

    // Fixed type fields
    amount: { type: Number },

    // Custom notes
    notes: { type: String },

    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deduction", deductionSchema);
