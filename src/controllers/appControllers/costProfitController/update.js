const { COST_PROFIT_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (Model, req, res) => {
  try {
    const { id } = req.params; // Business Segment ID from URL
    const { description } = req.body;

    // Validate description
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required and must be a non-empty string.",
      });
    }

    // Get old data before update
    const existingCenter = await Model.findOne(
      { _id: id, companyId: req.admin.companyId, removed: false }
    );

    if (!existingCenter) {
      return res.status(404).json({
        success: false,
        message: "Cost/Profit Center not found.",
      });
    }

    // Take snapshot before update
    const oldData = existingCenter.toObject();

    // Update using .save()
    existingCenter.description = description.trim();
    const updatedCenter = await existingCenter.save();

    // ---- ACTIVITY TRACKER ----
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.cost_profit_center,
      fileAffected: FILE.file_costProfitCenter_update,
      modelAffected: [MODEL_AFFECTED.model_costProfitCenter],
      eventType: COST_PROFIT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData, // ✅ Complete snapshot before update
      newData: updatedCenter.toObject(), // ✅ Complete snapshot after update
      description: `Cost/Profit center '${updatedCenter.costProfitCode}' updated by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      result: updatedCenter,
      message: "Cost/Profit Center description updated successfully.",
    });

  } catch (error) {
    console.error("Update Cost/Profit Center Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = update;
