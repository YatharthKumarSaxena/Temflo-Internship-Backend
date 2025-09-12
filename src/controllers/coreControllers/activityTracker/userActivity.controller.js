// controllers/activityTracker/userActivity.controller.js
const { errorMessage, throwInternalServerError, throwInvalidResourceError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { OK, BAD_REQUEST } = require('@/config/httpStatus.config');
const Activity = require("@/models/coreModels/ActivityTracker");
const mongoose = require("mongoose");

const getUserActivities = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const userId = req.admin._id;

        if (!userId) {
            return res.status(BAD_REQUEST).json({
                success: false,
                message: "Missing required parameter: userId"
            });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return throwInvalidResourceError(res, "User Id format");
        }

        const query = { userId };

        const activities = await Activity.find(query)
            .select("actionDone eventType timestamp") // only these fields
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(); // return plain JS objects

        // Format timestamp to user-readable
        const formattedActivities = activities.map(act => ({
            action: act.actionDone,
            event: act.eventType,
            time: new Date(act.timestamp).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
        }));

        const total = await Activity.countDocuments(query);

        logWithTime(`✅ 🎯 User activities fetched successfully 🚀`);
        return res.status(OK).json({
            success: true,
            message: "User activities fetched successfully",
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            activities: formattedActivities
        });
    } catch (error) {
        logWithTime("❌ Internal Error: Failed to Fetch User Activities 🗑️");
        errorMessage(error);
        return throwInternalServerError(res);
    }
};

module.exports = { getUserActivities };