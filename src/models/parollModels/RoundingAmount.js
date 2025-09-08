// models/RoundingSetting.js
const mongoose = require("mongoose");

const RoundingSettingSchema = new mongoose.Schema({
  roundingType: {
    type: String,
    enum: ["No Round", "Actual Round", "Round Up", "Round Down"],
    default: "No Round",
  },
}, { timestamps: true });

module.exports = mongoose.model("RoundingSetting", RoundingSettingSchema);
