// models/Subscription.js
const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        immutable: true,
    },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    createdAt: { type: Date, default: Date.now },

    // autoRenew: { type: Boolean, default: false },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
