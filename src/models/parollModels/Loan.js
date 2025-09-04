const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema({
  employee_id: String,
  amount: Number,
  issued_date: Date,
  recovered_amount: Number,
  status: String,
});
module.exports = mongoose.model('Loan', LoanSchema);