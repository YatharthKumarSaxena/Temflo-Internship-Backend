// models/Plan.js
const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        immutable: true,
        unique: true
    },

    name: { type: String, required: true }, // e.g. "Trial", "Starter", "Pro"
    durationDays: { type: Number, default: 45 }, // plan validity
    seatLimit: { type: Number, default: 10 },
    status: {
        type: String,
        enum: ["active", "trial", "expired", "suspended"],
        default: "trial"
    },

    includedModules: [
        {
            moduleKey: { type: String, required: true },  // e.g. "leave"
            plan: { type: String, default: "basic" },
            enabled: { type: Boolean, default: true },
        }
    ],

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Plan", PlanSchema);
