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
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, companyId: companyId },
      { removed: true },
      { new: true }
    );

    if (!updatedUser) {
      return throwDBResourceNotFoundError(res, "User");
    }

    logWithTime(`✅ 🎯 User Information (Experience and Degree) Deleted Successfully 🚀`);

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
      message: 'User Deleted successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to delete User 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = remove;