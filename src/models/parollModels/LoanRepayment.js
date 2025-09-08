const mongoose = require("mongoose");
const LoanRepaymentSchema = new mongoose.Schema({
  loan_id: { type: mongoose.Types.ObjectId, ref: 'Loan' },
  month: String,
  amount: Number,
});
module.exports = mongoose.model('LoanRepayment', LoanRepaymentSchema);
