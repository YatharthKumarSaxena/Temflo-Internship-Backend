const mongoose = require("mongoose");

const SalaryTemplateDeductionSchema = new mongoose.Schema({
  template_id: { type: mongoose.Types.ObjectId, ref: 'SalaryTemplate' },
  name: String,
  amount: Number,
});
module.exports = mongoose.model('SalaryTemplateDeduction', SalaryTemplateDeductionSchema);

