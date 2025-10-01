const User = require('../../../models/userModels/User'); // import your Employee/User model
const { PLANT_REMOVED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (Model, req, res) => {
  try {
    const id = req.admin._id;

    // Soft delete the Plant (or the given Model)
    const updatedPlant = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: req.admin.companyId },
      { removed: true },
      { new: false }
    );

    if (!updatedPlant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found or you do not have access to delete this Plant.',
      });
    }

    // Soft delete employees under this Plant
    const userUpdateResult = await User.updateMany(
      { plantId: req.params.id, companyId: req.admin.companyId },
      { removed: true }
    );

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.plant,
      fileAffected: FILE.file_plant_remove,
      modelAffected: [MODEL_AFFECTED.model_plant, MODEL_AFFECTED.model_user],
      eventType: PLANT_REMOVED,
      description: `Plant with Code '${updatedPlant.plantCode}' was soft deleted by ${getFullName(req.admin.employeeInfo)}. 
${userUpdateResult.modifiedCount} employees under this Plant were also marked as removed.`,
      actionDone: ACTIONS.delete,
      oldData: updatedPlant.toObject(),
      newData: {
        note: "All fields same as old data, Soft deletion is done. All Users belonging to this Plant ID and Company ID are soft deleted",
        removed: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Plant and associated employees deleted successfully',
    });
  } catch (error) {
    console.error('Soft delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;