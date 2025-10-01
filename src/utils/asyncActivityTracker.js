const Activity = require('@/models/coreModels/ActivityTracker');
const { errorMessage } = require('@/config/error-handler.config');
const { logWithTime } = require('./time-stamps');
const User = require('@/models/userModels/User'); // Populate user info for description
const { getFullName } = require("@/utils/commonFunctions");

const asyncDBActivityTracker = async ({
    userId,
    companyId,
    plantId,
    module,
    subModuleAffected,
    fileAffected,
    modelAffected,
    eventType,
    actionDone,
    oldData = null,
    newData = null,
    description = null, // optional new field
}) => {
    try {
        // ✅ Populate user info for description
        let userInfo = null;
        let name = 'Unknown';
        let email = null;
        let employeeCode = null;

        if (userId) {
            userInfo = await User.findById(userId).select('employeeInfo email employeeCode');
            if (userInfo) {
                name = getFullName(userInfo.employeeInfo);
                email = userInfo.email;
                employeeCode = userInfo.employeeCode;
            }
        }

        // ✅ Auto-generate description if not provided
        if (!description) {
            if (eventType === 'update') {
                description = `${modelAffected.join(', ')} updated for user ${name}`;
            } else if (eventType === 'delete') {
                description = `${modelAffected.join(', ')} soft deleted for user ${name}`;
            } else if (eventType === 'create') {
                description = `${modelAffected.join(', ')} created for user ${name}`;
            }
        }

        // ✅ Soft delete handling
        if (eventType === 'delete') {
            newData = { removed: true };
        }

        // ✅ Save activity with user snapshot
        await Activity.create({
            userId,
            companyId,
            plantId,
            module,
            subModuleAffected,
            fileAffected,
            modelAffected,
            eventType,
            actionDone,
            oldData,
            newData,
            description, // new optional field
            userSnapshot: { // ← snapshot of user info
                name,
                email,
                employeeCode
            }
        });

        logWithTime(`✅ Activity Tracker for Event: ${eventType} logged successfully`);
        return true;
    } catch (err) {
        logWithTime('❌ Internal Error: An Error occurred while saving the Activity Tracker');
        errorMessage(err);
        return false;
    }
};

module.exports = {
    asyncDBActivityTracker,
};