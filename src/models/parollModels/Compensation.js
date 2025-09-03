const mongoose = require("mongoose");

const compensationSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "UserWithBatch", required: true },
    gross: { type: Number, required: true },
    basic: { type: Number, required: true },
    variable: { type: Number, default: 0 },
    gratuity: { type: Number, default: 0 },
    ctc: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Cash Only", "Bank Deposit"], default: "Cash Only" },

    allowances: { type: Object, default: {} },
    deductions: { type: Object, default: {} },

    // ✅ Statutory Settings aligned with your React form
    statutorySettings: {
      professionTaxExemption: { type: Boolean, default: false },
      professionTaxDetails: {
        seniorCitizen: { type: Boolean, default: false },
        mentallyChallenged: { type: Boolean, default: false },
        physicalDisability: { type: Boolean, default: false },
        other: { type: Boolean, default: false }
      },

      includePF: { type: Boolean, default: false },
      pfContributionRate: { 
        type: String, 
        enum: ["restrict_15000", "actual_wage", "employee_actual_employer_restricted"], 
        default: "restrict_15000" 
      },
      employeePF: { type: Number, default: 12 }, // %
      employerPF: { type: Number, default: 13 }, // %

      includeESI: { type: Boolean, default: false },
      esiContribution: { 
        type: String, 
        enum: ["restrict_21000", "automatic"], 
        default: "restrict_21000" 
      },

      hra: { 
        type: String, 
        enum: ["none", "metropolitan", "non-metropolitan", "custom"], 
        default: "none" 
      },
      customHra: { type: Number, default: 0 }, // % entered manually

      tdsBasedOn: { 
        type: String, 
        enum: ["slab", "percentage"], 
        default: "slab" 
      },
      taxRegime: { 
        type: String, 
        enum: ["old", "new"], 
        default: "new" 
      },
    },

    effectiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Compensation", compensationSchema);
