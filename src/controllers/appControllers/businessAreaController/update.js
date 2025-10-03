const { BUSINESS_AREA_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");
const { throwDBResourceNotFoundError, errorMessage, throwInternalServerError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { OK } = require("@/config/httpStatus.config");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    // single query: update + return old document
    const oldBusinessArea = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { description: req.body.description },
      { new: false }  // old doc
    );

    if (!oldBusinessArea) {
      return throwDBResourceNotFoundError(res, "Business Area");
    }

    const updatedBusinessArea = await Model.findById(req.params.id).lean(); // full new snapshot

    logWithTime(`✅ 🎯 Business Area Updated Successfully 🚀`);

    // Activity Tracker logging with complete snapshots
    activityTracker({
      userId: req.admin._id,
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.business,
      fileAffected: FILE.file_business_update,
      modelAffected: [MODEL_AFFECTED.model_company],
      eventType: BUSINESS_AREA_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldBusinessArea.toObject(),
      newData: updatedBusinessArea,
      description: `Business Area '${oldBusinessArea.name}' updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      result: updatedBusinessArea,
      message: "Business Area updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Business Area 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;