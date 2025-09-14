const mongoose = require('mongoose');
const { PROFILE_DELETED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError, throwInvalidResourceError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');

const deleteInfo = async (req, res, next) => {
  const { infoType, deleteId } = req.params;
  const User = mongoose.model('User');
  const allowedTypes = ['degreeInfo', 'experience'];

  if (!allowedTypes.includes(infoType)) {
    return throwInvalidResourceError(res, 'Invalid URL');
  }

  try {
    // First, find the user with the item to delete
    const user = await User.findOne({ _id: req.admin._id, [`${infoType}._id`]: deleteId });
    if (!user) {
      return throwDBResourceNotFoundError(res, `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'}`);
    }

    // Find the item to delete for oldData logging
    const itemToDelete = user[infoType].find(item => item._id.toString() === deleteId);

    // Now delete the item
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.admin._id, [`${infoType}._id`]: deleteId },
      { $pull: { [infoType]: { _id: deleteId } } },
      { new: true }
    );

    logWithTime(`✅ 🎯 User Profile ${infoType} removed Successfully 🚀`);

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: user.companyId,
      plantId: user.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.profile,
      fileAffected: FILE.file_profile_deleteInfo,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: PROFILE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: itemToDelete,
      newData: null
    });

    return res.status(OK).json({
      message: `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'} deleted successfully`,
      data: updatedUser
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to remove Profile 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};


module.exports = deleteInfo;