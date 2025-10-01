const { OK } = require("@/config/httpStatus.config");
const { DEPARTMENT_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    // fetch old document before update
    const oldDepartment = await Model.findOne(
      { _id: req.params.id, companyId: companyId }
    ).lean();

    if (!oldDepartment) {
      return throwDBResourceNotFoundError(res, "Department");
    }

    // update document
    await Model.updateOne(
      { _id: req.params.id, companyId: companyId },
      { description: req.body.description }
    );

    // fetch updated document for full snapshot
    const updatedDepartment = await Model.findById(req.params.id).lean();

    logWithTime(`✅ 🎯 Department Updated Successfully 🚀`);

    // Activity Tracker logging with full snapshots
    activityTracker({
      userId: req.admin._id,
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.department,
      fileAffected: FILE.file_department_update,
      modelAffected: [MODEL_AFFECTED.model_department],
      eventType: DEPARTMENT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldDepartment,
      newData: updatedDepartment,
      description: `Department '${oldDepartment.name}' updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      result: updatedDepartment,
      message: "Department updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Department 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;
