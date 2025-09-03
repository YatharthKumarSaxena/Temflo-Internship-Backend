// models/PayslipSettings.js
const mongoose = require("mongoose");

const PayslipSettingsSchema = new mongoose.Schema(
  {
    leftToggles: {
      type: Map,
      of: Boolean,
      default: {
        "Show Date Of Joining": true,
        "Show YTD Amounts": true,
        "Show IT Declarations": true,
        "Show Bank Information": true,
        "Show Payment Method": false,
        "Show Paid Days": false,
        "Show Leave Balance": true,
        "Show Additional/Reduce Income Tax": true,
        "Show Masked Numbers": true,
      },
    },
    rightToggles: {
      type: Map,
      of: Boolean,
      default: {
        "Show Department": true,
        "Show Address Info": true,
        "Show Aadhaar": true,
        "Show PAN": true,
        "Show ESI": true,
        "Show PF": true,
        "Show PF UAN": true,
        "Show Tax Regime": true,
        "Show Loss Of Pay Days": false,
      },
    },
    docSettings: {
      aadhaar: { type: Boolean, default: true },
      pan: { type: Boolean, default: true },
      esi: { type: Boolean, default: true },
      pf: { type: Boolean, default: true },
      pfUan: { type: Boolean, default: true },
      bank: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayslipSettings", PayslipSettingsSchema);
