const { DEPARTMENT_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (Model, req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const companyId = req.admin.companyId;

    // Validate description
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required and must be a non-empty string.",
      });
    }

    // Fetch existing department
    const existingDepartment = await Model.findOne({
      _id: id,
      companyId,
      removed: false
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found."
      });
    }

    // Snapshot before update
    const oldData = existingDepartment.toObject();

    // Update using .save()
    existingDepartment.description = description.trim();
    const updatedDepartment = await existingDepartment.save();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.department,
      fileAffected: FILE.file_department_update,
      modelAffected: [MODEL_AFFECTED.model_department],
      eventType: DEPARTMENT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: updatedDepartment.toObject(),
      description: `Department updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
    });

    return res.status(200).json({
      success: true,
      result: updatedDepartment,
      message: "Department description updated successfully.",
    });

  } catch (error) {
    console.error("Update Department Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = update;