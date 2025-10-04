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
    const { description } = req.body;

    // Fetch existing document
    const existingBusinessArea = await Model.findOne({
      _id: req.params.id,
      companyId: companyId
    });

    if (!existingBusinessArea) {
      return throwDBResourceNotFoundError(res, "Business Area");
    }

    // Take snapshot before update
    const oldData = existingBusinessArea.toObject();

    // Update using .save()
    existingBusinessArea.description = description;
    const updatedBusinessArea = await existingBusinessArea.save();

    logWithTime(`✅ 🎯 Business Area Updated Successfully 🚀`);

    // Activity Tracker
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
      oldData: oldData,                     // ✅ snapshot before
      newData: updatedBusinessArea.toObject(), // ✅ snapshot after
      description: `Business Area '${existingBusinessArea.name}' updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(OK).json({
      success: true,
      result: updatedBusinessArea,
      message: "Business Area description updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Business Area 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;