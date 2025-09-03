const mongoose = require("mongoose");
const SalaryTemplateSchema = new mongoose.Schema({
  name: String,
  base_salary: Number,
});
module.exports = mongoose.model('SalaryTemplate', SalaryTemplateSchema);