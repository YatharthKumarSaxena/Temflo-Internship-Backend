const mongoose = require('mongoose');
const { USER_INFO_DELETED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwMissingFieldsError, throwInvalidResourceError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');
const { getFullName } = require("@/utils/commonFunctions");

const deleteInfo = async (req, res, next) => {
  const { infoType, id, deleteId } = req.params;
  const User = mongoose.model('User');

  // Validate infoType
  const allowedTypes = ['degreeInfo', 'experience'];
  if (!allowedTypes.includes(infoType)) {
    return throwInvalidResourceError(res, "URL");
  }

  try {

    const userBeforeUpdate = await User.findOne({ _id: id });

    const deletedInfo = userBeforeUpdate[infoType].find(item => item._id.toString() === deleteId);

    // Pull the item from the specified array
    const result = await User.findOneAndUpdate(
      { _id: id, [`${infoType}._id`]: deleteId }, // Check existence
      { $pull: { [infoType]: { _id: deleteId } } },
      { new: true }
    );

    if (!result) {
      return throwDBResourceNotFoundError(res, `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'}`);
    }

    logWithTime(`✅ 🎯 User Information (Experience and Degree) Deleted Successfully 🚀`);

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.user,
      fileAffected: FILE.file_user_deleteInfo,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: USER_INFO_DELETED,
      actionDone: ACTIONS.delete,
      oldData: { [infoType]: userBeforeUpdate[infoType] }, // poora array before deletion
      newData: { [infoType]: result[infoType] },           // updated array after deletion
      description: `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'} deleted by ${getFullName(req.admin.employeeInfo)}: ${deletedInfo ? deletedInfo.title || deletedInfo.companyName || deletedInfo.institutionName : 'N/A'}`
    });

    return res.status(OK).json({ message: `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'} deleted successfully`, data: result });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to delete User Information 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = deleteInfo;