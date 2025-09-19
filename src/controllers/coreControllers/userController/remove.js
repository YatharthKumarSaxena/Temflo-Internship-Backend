const mongoose = require('mongoose');
const { USER_DELETED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwMissingFieldsError, throwInvalidResourceError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');

const remove = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const companyId = req.admin.companyId;
    const id = req.params.id;
    
    const {removed} = req.body;
    if (typeof removed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'activate (true/false) must be provided in body',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }


    const newRemovedStatus = removed;

    user.removed = newRemovedStatus;
    await user.save();


    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.user,
      fileAffected: FILE.file_user_remove,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: USER_DELETED,
      actionDone: ACTIONS.delete,
      oldData: {
        userId: id,
        removed: false
      },
      newData: {
        removed: true
      }
    });

    return res.status(OK).json({
      success: true,
      message: `User ${removed ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to Deactivate/Activate User 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = remove;