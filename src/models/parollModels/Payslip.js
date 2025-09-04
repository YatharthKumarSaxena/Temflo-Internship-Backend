const mongoose = require("mongoose");
const PayslipSchema = new mongoose.Schema({
  employee_id: String,
  batch_id: { type: mongoose.Types.ObjectId, ref: 'PayrollBatch' },
  month: String,
  file_url: String,
  sent: Boolean,
  sent_date: Date,
});
module.exports = mongoose.model('Payslip', PayslipSchema);
