const Activity = require('@/models/coreModels/ActivityTracker');
const { errorMessage } = require('@/config/error-handler.config');
const { logWithTime } = require('./time-stamps');

const activityTracker = async ({
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
}) => {
  try {
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
    });

    return true;
  } catch (err) {
    logWithTime('❌ Internal Error: An Error occurred while saving the Activity Tracker');
    errorMessage(err);
    return false;
  }
};

module.exports = {
  activityTracker,
};
