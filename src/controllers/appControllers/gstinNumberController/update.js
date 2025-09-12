const { OK } = require("@/config/httpStatus.config");
const { GSTIN_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    const { stateCode, gstinNumber } = req.body;

    // Single query → get old doc + perform update
    const oldGSTIN_Number = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { stateCode, gstinNumber },
      { new: false } // return OLD data
    );

    if (!oldGSTIN_Number) {
      return throwDBResourceNotFoundError(res, "GSTIN Number");
    }

    logWithTime(`✅ 🎯 Document updated Successfully 🚀`);

    // Activity Tracker logging
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
      oldData: {
        _id: req.params.id,
        stateCode: oldGSTIN_Number.stateCode,
        gstinNumber: oldGSTIN_Number.gstinNumber
      },
      newData: {
        stateCode,
        gstinNumber
      }, // request body already has new values
    });

    return res.status(OK).json({
      success: true,
      result: { stateCode, gstinNumber }, // return new data for client clarity
      message: "GSTIN Number updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update GSTIN Number 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;