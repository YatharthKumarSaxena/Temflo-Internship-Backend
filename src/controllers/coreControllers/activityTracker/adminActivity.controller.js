// controllers/activityTracker/userActivity.controller.js
const {
    errorMessage,
    throwInternalServerError,
    throwInvalidResourceError
} = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { OK } = require("@/config/httpStatus.config");
const Activity = require("@/models/coreModels/ActivityTracker");
const mongoose = require("mongoose");

/**
 * Utility: extract only selected keys from object
 */
const extractSelectedFields = (obj, keys) => {
    if (!obj || !keys) return obj || null;
    const result = {};
    keys.forEach(k => {
        if (k in obj) result[k] = obj[k];
    });
    return result;
};

/**
 * Utility: build nested Mongo query for oldData/newData
 */
const buildNestedQuery = (prefix, filters) => {
    if (!filters) return {};
    const nestedQuery = {};
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (typeof value === "string") {
            nestedQuery[`${prefix}.${key}`] = { $regex: value, $options: "i" };
        } else {
            nestedQuery[`${prefix}.${key}`] = value;
        }
    });
    return nestedQuery;
};

/**
 * Validate ObjectId
 */
const validateObjectIds = (ids) => {
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    return invalidIds;
};

const getAdminActivities = async (req, res) => {
    try {
        const {
            userId,
            plantId,
            module,
            fileAffected,
            subModuleAffected,
            modelAffected,
            eventType,
            actionDone,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            selectFields,    // comma-separated top-level fields to return
            oldDataFields,   // comma-separated keys for oldData
            userSnapshotFields, // comma-separated keys for User Snapshot Details
            newDataFields,   // comma-separated keys for newData
            oldDataSearch,   // JSON string
            newDataSearch   // JSON string
        } = req.query;

        // Validate userId(s)
        if (userId) {
            const ids = userId.split(",").map(id => id.trim());
            const invalidIds = validateObjectIds(ids);
            if (invalidIds.length > 0) {
                return throwInvalidResourceError(
                    res,
                    `Invalid User Id format: ${invalidIds.join(", ")}`
                );
            }
        }

        let query = {};
        const buildRegex = value => ({ $regex: value, $options: "i" });

        /**
         * Multi-field general filter
         */
        const multiFilter = (field, value, isArrayField = false, isObjectIdField = false) => {
            if (!value) return;

            if (isObjectIdField) {
                let ids = [];
                if (Array.isArray(value)) {
                    ids = value.filter(v => mongoose.Types.ObjectId.isValid(v)).map(v => new mongoose.Types.ObjectId(v));
                } else if (typeof value === "string" && value.includes(",")) {
                    ids = value.split(",").map(v => v.trim()).filter(v => mongoose.Types.ObjectId.isValid(v)).map(v => new mongoose.Types.ObjectId(v));
                } else if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
                    ids = [new mongoose.Types.ObjectId(value)];
                }
                if (ids.length > 0) query[field] = { $in: ids };
                return;
            }

            if (Array.isArray(value)) {
                query[field] = isArrayField
                    ? { $elemMatch: { $in: value.map(v => new RegExp(v, "i")) } }
                    : { $in: value };
            } else if (typeof value === "string" && value.includes(",")) {
                const valuesArray = value.split(",").map(v => v.trim());
                query[field] = isArrayField
                    ? { $elemMatch: { $in: valuesArray.map(v => new RegExp(v, "i")) } }
                    : { $in: valuesArray };
            } else if (typeof value === "string") {
                query[field] = isArrayField
                    ? { $elemMatch: buildRegex(value) }
                    : buildRegex(value);
            } else {
                query[field] = value;
            }
        };

        // Apply top-level filters
        multiFilter("userId", userId, false, true);
        // multiFilter("companyId", companyId);
        multiFilter("plantId", plantId, false, true);
        multiFilter("module", module);
        multiFilter("fileAffected", fileAffected);
        multiFilter("subModuleAffected", subModuleAffected);
        multiFilter("modelAffected", modelAffected, true);
        multiFilter("eventType", eventType);
        multiFilter("actionDone", actionDone);
        multiFilter("userSnapshot.name", req.query.userSnapshotName);
        multiFilter("userSnapshot.email", req.query.userSnapshotEmail);
        multiFilter("userSnapshot.employeeCode", req.query.userSnapshotCode);

        // ✅ Force filter by admin's companyId
        if (req.admin?.companyId) {
            query.companyId = req.admin.companyId;
        }

        // Date filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        // Parse old/new data search filters
        let oldDataFilters = null;
        let newDataFilters = null;
        try {
            if (oldDataSearch) oldDataFilters = JSON.parse(oldDataSearch);
            if (newDataSearch) newDataFilters = JSON.parse(newDataSearch);
        } catch (e) {
            return throwInvalidResourceError(res, "Invalid JSON in oldDataSearch/newDataSearch");
        }

        // Merge nested filters into main query for Mongo-side filtering
        query = {
            ...query,
            ...buildNestedQuery("oldData", oldDataFilters),
            ...buildNestedQuery("newData", newDataFilters)
        };

        // Fetch total with filters
        const total = await Activity.countDocuments(query);

        // Fetch paginated activities
        const activities = await Activity.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        // Parse top-level and old/new keys for response
        const topFields = selectFields ? selectFields.split(",").map(f => f.trim()) : null;
        const oldKeys = oldDataFields ? oldDataFields.split(",").map(k => k.trim()) : null;
        const newKeys = newDataFields ? newDataFields.split(",").map(k => k.trim()) : null;
        const userSnapshotKeys = userSnapshotFields ? userSnapshotFields.split(",").map(k => k.trim()) : null;
        // Format response
        const formattedActivities = activities.map(act => {
            const topLevel = topFields ? extractSelectedFields(act, topFields) : {
                userId: act.userId,
                companyId: act.companyId,
                plantId: act.plantId,
                module: act.module,
                fileAffected: act.fileAffected,
                subModuleAffected: act.subModuleAffected,
                modelAffected: act.modelAffected,
                event: act.eventType,
                action: act.actionDone,
                userSnapshot: act.userSnapshot,
                description: act.description
            };

            return {
                ...topLevel,
                modelAffected: act.modelAffected,
                userSnapshot: userSnapshotKeys ? extractSelectedFields(act.userSnapshot, userSnapshotKeys) : act.userSnapshot,
                oldData: oldKeys ? extractSelectedFields(act.oldData, oldKeys) : act.oldData,
                newData: newKeys ? extractSelectedFields(act.newData, newKeys) : act.newData,
                time: new Date(act.timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
            };
        });

        logWithTime(`✅ 🎯 Admin fetched activities successfully 🚀`);
        return res.status(OK).json({
            success: true,
            message: "Admin activities fetched successfully",
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            activities: formattedActivities
        });

    } catch (error) {
        logWithTime("❌ Internal Error: Failed to Fetch Admin Activities 🗑️");
        errorMessage(error);
        return throwInternalServerError(res);
    }
};

module.exports = { getAdminActivities };