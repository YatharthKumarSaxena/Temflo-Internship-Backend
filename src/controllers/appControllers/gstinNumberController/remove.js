const { OK } = require("@/config/httpStatus.config");
const { GSTIN_REMOVED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    const updatedGSTINNumber = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { removed: true },
      { new: false } 
    );

    if (!updatedGSTINNumber) {
      return throwDBResourceNotFoundError(res, "GSTIN Number");
    }

    logWithTime(`✅ 🎯 Document removed Successfully 🚀`);
    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.gstinNumber,
      fileAffected: FILE.file_gstinNumber_remove,
      modelAffected: [MODEL_AFFECTED.model_gstinNumber],
      eventType: GSTIN_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: updatedGSTINNumber.toObject(),
      newData: {
        note: "All fields same as old data, Soft deletion is done",
        removed: true
      },
      description: `GSTIN Number '${updatedGSTINNumber.gstinNumber}' removed by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      message: 'GSTIN Number Deleted successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to remove GSTIN Number 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = remove;