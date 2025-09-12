const { BUSINESS_AREA_REMOVED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const remove = async (Model, req, res) => {
  try {
    const id = req.admin.companyId;

    const updatedBusinessArea = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: id },
      { removed: true },
      { new: false } 
    );

    if (!updatedBusinessArea) {
      return res.status(404).json({
        success: false,
        message: 'Business Area not found or you do not have access to delete this business area.',
      });
    }

    // ✅ Activity Tracker logging (added only, no extra structural changes)
    activityTracker({
      userId: req.admin._id, 
      companyId: id,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.business,
      fileAffected: FILE.file_business_remove,
      modelAffected: [MODEL_AFFECTED.model_company],
      eventType: BUSINESS_AREA_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: updatedBusinessArea.toObject(), 
      newData: {
        note: "All fields same as old data, Soft deletion is done",
        removed: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Business Area Deleted successfully',
    });

  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;