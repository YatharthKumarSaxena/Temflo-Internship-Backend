const { DEPARTMENT_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (Model, req, res) => {
    try {
      const { id } = req.params; // Business Segment ID from URL
      const { description } = req.body;
      const companyId = req.admin.companyId;

      // Validate description
      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description is required and must be a non-empty string.",
        });
      }
      const oldDepartment = await Model.findOne({ _id: id, companyId: companyId, removed: false });
      
      if (!oldDepartment) {
        return res.status(404).json({
          success: false,
          message: "Department not found."
        });
      }

      // Update only description
      const updatedSegment = await Model.findOneAndUpdate(
        { _id: id, companyId: req.admin.companyId, removed: false },
        { description: description.trim() },
        { new: true }
      );

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
        newData: updatedSegment,
        description: `Department updated by ${getFullName(req.admin.employeeInfo)} for Company ID: ${companyId}`
      });

      return res.status(200).json({
        success: true,
        result: updatedSegment,
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
  
