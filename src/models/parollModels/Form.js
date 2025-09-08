const mongoose = require("mongoose");

const FormSchema = new mongoose.Schema({
  employee_id: String,
  type: String,
  year: Number,
  file_url: String,
  generated_at: Date,
});
module.exports = mongoose.model('Form', FormSchema);