const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PERMISSION_CREATED } = require("@/config/activity.enums");

const create = async (Model, req, res) => {
  const { employeeId, plantId, features } = req.body;

  try {
    // Check if permission already exists
    const existingPermission = await Model.findOne({
      employeeId,
      plantId,
      companyId: req.admin.companyId,
    });
    if (existingPermission) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Permission already exists for this employee in this plant',
        });
    }

    // Create new permission
    const newPermission = new Model({
      employeeId,
      plantId,
      companyId: req.admin.companyId,
      features,
    });

    await newPermission.save();

    // Sync permissions to User model
    await syncUserPermissions(employeeId);

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId || null,
      module: MODULE.permission,
      subModuleAffected: null,
      fileAffected: FILE.file_permission_create,
      modelAffected: [MODEL_AFFECTED.model_permission],
      eventType: PERMISSION_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: newPermission.toObject()
    });

    return res
      .status(201)
      .json({
        success: true,
        message: 'Permission created successfully',
        permission: newPermission,
      });
  } catch (err) {
    console.error('Error creating permission:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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

module.exports = create;