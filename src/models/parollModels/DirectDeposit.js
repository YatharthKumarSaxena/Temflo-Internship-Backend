const mongoose = require("mongoose");

const DirectDepositSchema = new mongoose.Schema({
  batch_id: { type: mongoose.Types.ObjectId, ref: 'PayrollBatch' },
  bank_file_url: String,
  payment_status: String,
  processed_at: Date,
});
module.exports = mongoose.model('DirectDeposit', DirectDepositSchema);
