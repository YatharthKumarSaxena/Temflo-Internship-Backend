const mongoose = require('mongoose');

const remove = async (Model, req, res) => {
  try {
    const id = req.admin.companyId;
    const permission = await Model.findOneAndDelete({ _id: req.params.id, companyId: id });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found. ',
      });
    }

    // Sync permissions to User model after deletion
    await syncUserPermissions(permission.employeeId);

    return res.status(200).json({
      success: true,
      message: 'Permission Deleted successfully',
    });
  } catch (error) {
    console.error('Update Admin Error:', error);
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

module.exports = remove;
