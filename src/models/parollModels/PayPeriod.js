const mongoose = require("mongoose");

const payPeriodSchema = new mongoose.Schema({
  startDay: { type: String, default: "1" },
  payDays: { type: String, default: "actual" },
  includeWeekly: { type: String, default: "yes" },
  includeHolidays: { type: String, default: "yes" },
  basicPct: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model("PayPeriod", payPeriodSchema);
