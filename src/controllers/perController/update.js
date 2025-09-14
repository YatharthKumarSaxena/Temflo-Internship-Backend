const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PERMISSION_UPDATED } = require("@/config/activity.enums");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { employeeId, plantId, features } = req.body;

    // 1️⃣ Find permission document
    const permission = await Model.findOne({ employeeId, plantId, companyId });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found.',
      });
    }

    // 2️⃣ Save oldData before updating
    const oldData = JSON.parse(JSON.stringify(permission.features));
    oldData._id = permission._id;
    oldData.employeeId = employeeId;
    oldData.plantId = plantId;
    
    // 3️⃣ Update features
    permission.features = features;
    await permission.save();

    // 4️⃣ Sync permissions to User model
    await syncUserPermissions(employeeId);

    // 5️⃣ Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.permission,
      subModuleAffected: null,
      fileAffected: FILE.file_permission_update,
      modelAffected: [MODEL_AFFECTED.model_permission],
      eventType: PERMISSION_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: { note: "This feature is added, rest data is same as old data ", features }
    });

    return res.status(200).json({
      success: true,
      message: 'Permission Updated successfully',
      permission,
    });
  } catch (error) {
    console.error('Update Permission Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Helper function to sync permissions from Permission collection to User model
const syncUserPermissions = async (employeeId) => {
  try {
    const User = mongoose.model('User');
    const Permission = mongoose.model('Permission');

    // Get all permissions for this employee across all plants
    const permissions = await Permission.find({ employeeId });

    // Extract unique feature names
    const uniqueFeatures = new Set();
    permissions.forEach((permission) => {
      permission.features.forEach((feature) => {
        uniqueFeatures.add(feature.featureName);
      });
    });

    // Update User model with aggregated permissions
    await User.findByIdAndUpdate(
      employeeId,
      { permissions: Array.from(uniqueFeatures) },
      { new: true }
    );
  } catch (error) {
    console.error('Error syncing user permissions:', error);
  }
};

module.exports = update;