const mongoose = require("mongoose");

const TDSConfigSchema = new mongoose.Schema({
  tdsCalc: {
    type: String,
    enum: ["monthly", "yearly", "estimated"],
    default: "estimated"
  },
  taxPref: {
    type: String,
    enum: ["subsequent", "same"],
    default: "same"
  }
});

module.exports = mongoose.model("TDSConfig", TDSConfigSchema);
