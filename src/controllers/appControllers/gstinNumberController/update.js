const { OK } = require("@/config/httpStatus.config");
const { GSTIN_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { stateCode, gstinNumber } = req.body;

    // fetch old document before update
    const oldGSTIN = await Model.findOne({ _id: req.params.id, companyId: companyId }).lean();
    if (!oldGSTIN) {
      return throwDBResourceNotFoundError(res, "GSTIN Number");
    }

    // update document
    await Model.updateOne(
      { _id: req.params.id, companyId: companyId },
      { stateCode, gstinNumber }
    );

    // fetch updated document for full snapshot
    const updatedGSTIN = await Model.findById(req.params.id).lean();

    logWithTime(`✅ 🎯 GSTIN Number Updated Successfully 🚀`);

    // Activity Tracker logging with full snapshots
    activityTracker({
      userId: req.admin._id,
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.gstinNumber,
      fileAffected: FILE.file_gstinNumber_update,
      modelAffected: [MODEL_AFFECTED.model_gstinNumber],
      eventType: GSTIN_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldGSTIN,
      newData: updatedGSTIN,
      description: `GSTIN Number '${oldGSTIN.gstinNumber}' updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      result: updatedGSTIN,
      message: "GSTIN Number updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update GSTIN Number 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;