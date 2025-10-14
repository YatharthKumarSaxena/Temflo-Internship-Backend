const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { ACTIVITY_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const createActivity = async (req, res) => {
  try {
    const Activity = mongoose.model('Activity');

    const { plantId, projectId, types, text } = req.body;

    if (!plantId || !projectId || !types) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const activity = new Activity({
      companyId: req.admin.companyId,
      plantId,
      projectId,
      activityBy: req.admin._id,
      types,
      text,
    });
    console.log('activity', activity);
    await activity.save();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.activity,
      fileAffected: FILE.file_create_activity,
      modelAffected: [MODEL_AFFECTED.model_activity],
      eventType: ACTIVITY_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: activity.toObject(),
      description: `Activity created by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Activity Added Successfully',
    });
  } catch (error) {
    console.error('Activity Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createActivity;