const mongoose = require("mongoose");

const SettlementSchema = new mongoose.Schema({
  employee_id: String,
  final_amount: Number,
  settlement_date: Date,
  salary_due: Number,
  leave_encashment: Number,
  deductions: Number,
  status: String,
});
module.exports = mongoose.model('Settlement', SettlementSchema);
