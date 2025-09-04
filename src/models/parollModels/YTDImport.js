const mongoose = require("mongoose");

const YTDImportSchema = new mongoose.Schema({
  employee_id: String,
  financial_year: String,
  gross: Number,
  net: Number,
  tds: Number,
  source: String,
  imported_at: Date,
});
module.exports = mongoose.model('YTDImport', YTDImportSchema);
