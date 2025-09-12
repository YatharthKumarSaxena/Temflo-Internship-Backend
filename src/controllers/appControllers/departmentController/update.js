const { OK } = require("@/config/httpStatus.config");
const { DEPARTMENT_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { description } = req.body;

    // single query: update + return old document
    const oldDepartment = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { description },
      { new: false }  // return pre-update document
    );

    if (!oldDepartment) {
      return throwDBResourceNotFoundError(res, "Department");
    }

    logWithTime(`✅ 🎯 Department Updated Successfully 🚀`);

    // Activity Tracker logging
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
      oldData: { _id: req.params.id, description: oldDepartment.description },
      newData: { description },
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldDepartment.toObject(), description }, // updated version return
      message: "Department updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Department 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;
