const mongoose = require("mongoose");

const TaxRuleSchema = new mongoose.Schema({
  template_id: { type: mongoose.Types.ObjectId, ref: 'SalaryTemplate' },
  section: String,
  limit: Number,
});
module.exports = mongoose.model('TaxRule', TaxRuleSchema);
