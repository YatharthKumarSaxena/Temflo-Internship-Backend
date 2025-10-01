const { OK } = require("@/config/httpStatus.config");
const { DEPARTMENT_REMOVED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId; // Company ID from admin token

    const updatedDepartment = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { removed: true },
      { new: false } 
    );

    if (!updatedDepartment) {
      return throwDBResourceNotFoundError(res, "Department");
    }

    logWithTime(`✅ 🎯 Department Removed Successfully 🚀`);

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.department,
      fileAffected: FILE.file_department_remove,
      modelAffected: [MODEL_AFFECTED.model_department],
      eventType: DEPARTMENT_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: updatedDepartment.toObject(),
      newData: { 
        note: "All fields same as old data, Soft deletion is done",
        removed: true 
      },
      description: `Department '${updatedDepartment.name}' removed by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      message: 'Department Deleted successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to remove Department 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = remove;