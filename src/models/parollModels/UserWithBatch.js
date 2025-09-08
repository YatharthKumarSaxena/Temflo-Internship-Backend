const mongoose = require("mongoose");

const userWithBatchSchema = new mongoose.Schema(
  {
    removed: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    email: { type: String, required: true, unique: true },
    status: { type: String, default: "active" },
    team: { type: Array, default: [] },
    leadTeam: { type: Array, default: [] },
    image: { type: String, default: "user.png" },
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "IN" },
    pinCode: { type: String },
    phoneNumber: { type: String },
    isDetailUpdated: { type: Boolean, default: false },
    code: { type: String },
    role: {
      type: String,
      enum: ["owner", "manager", "employee"],
      default: "owner",
    },
    degreeInfo: { type: Array, default: [] },
    experience: { type: Array, default: [] },
    created: { type: Date, default: Date.now },
    companyId: { type: String, required: true, unique: true },
    legalStatus: { type: String },
    pan: { type: String },
    tan: { type: String },
    year: { type: String },

    // ✅ New batch fields
    batches: { type: [String], default: [] },          // list of all batch names
    selectedBatch: { type: String, default: "Not selected any batch" }, // user choice
    isBatchSelected: { type: Boolean, default: false }, // true when user picks a batch
  }, { timestamps: true });

module.exports = mongoose.model("UserWithBatch", userWithBatchSchema);
