const { BUSINESS_AREA_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    const { description } = req.body;

    // single query: update + return old document
    const oldBusinessArea = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      { description },
      { new: false }  // return pre-update doc
    );

    if (!oldBusinessArea) {
      return throwDBResourceNotFoundError(res, "Business Area");
    }

    logWithTime(`✅ 🎯 Business Area Updated Successfully 🚀`);

    // Activity Tracker logging
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
      oldData: { _id: req.params.id, description: oldBusinessArea.description },
      newData: { description },
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldBusinessArea.toObject(), description }, // updated version
      message: "Business Area updated successfully",
    });

  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Business Area 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;
