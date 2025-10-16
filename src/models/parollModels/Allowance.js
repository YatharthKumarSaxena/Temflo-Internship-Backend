// models/Allowance.js
const mongoose = require("mongoose");

const allowanceSchema = new mongoose.Schema(
  {
    mapping: {
      type: String,
      required: true,
      enum: ["hra", "special", "gratuity"], // restrict values
    },
    name: { type: String, required: true },
    section: { type: String },
    taxable: { type: String, enum: ["yes", "no"], required: true },
    maxLimit: { type: Number }, // Only applicable if taxable = no
    pfApplicable: { type: String, enum: ["yes", "no"], required: true },
    esiApplicable: { type: String, enum: ["yes", "no"], required: true },
    ptApplicable: { type: String, enum: ["yes", "no"], required: true },
    lopDependent: { type: String, enum: ["yes", "no"], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Allowance", allowanceSchema);
