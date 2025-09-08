const mongoose = require("mongoose");

const SalaryTemplateAllowanceSchema = new mongoose.Schema({
  template_id: { type: mongoose.Types.ObjectId, ref: 'SalaryTemplate' },
  name: String,
  amount: Number,
});
module.exports = mongoose.model('SalaryTemplateAllowance', SalaryTemplateAllowanceSchema);