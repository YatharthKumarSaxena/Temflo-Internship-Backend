const { BUSINESS_SEGMENT_UPDATED } = require("@/config/activity.enums");
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

    // ✅ Get complete snapshot BEFORE update
    const existingSegment = await Model.findOne({
      _id: id,
      companyId: req.admin.companyId,
      removed: false
    });

    if (!existingSegment) {
      return res.status(404).json({
        success: false,
        message: "Business Segment not found.",
      });
    }

    // ✅ Take complete snapshot BEFORE update
    const oldData = existingSegment.toObject();

    // ✅ Update using .save()
    existingSegment.description = description.trim();
    const updatedSegment = await existingSegment.save();

    // ---- ACTIVITY TRACKER ----
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.business_segment,
      fileAffected: FILE.file_businessSegment_update,
      modelAffected: [MODEL_AFFECTED.model_businessSegment],
      eventType: BUSINESS_SEGMENT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData, // ✅ Complete snapshot BEFORE
      newData: updatedSegment.toObject(), // ✅ Complete snapshot AFTER
      description: `Business segment '${existingSegment.segmentCode}' description updated from '${oldData.description}' to '${description.trim()}' by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      result: updatedSegment,
      message: "Business Segment description updated successfully.",
    });

  } catch (error) {
    console.error("Update Business Segment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = update;
