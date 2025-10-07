const mongoose = require('mongoose');

const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const read = require('./read');
const remove = require('./remove');
const update = require('./update');
const create = require('./create');
const feature = require('./feature');

function modelController() {
  const Model = mongoose.model('Permission');
  const UserModel = mongoose.model('User');
  const methods = createCRUDController('Permission');

  methods.update = (req, res) => update(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.create = (req, res) => create(Model, req, res);
  methods.read = (req, res) => read(Model, req, res);
  methods.feature = (req, res) => feature(UserModel, req, res);

  // Add sync method for syncing all user permissions
  methods.syncAllPermissions = async (req, res) => {
    try {
      // Get all unique employee IDs with permissions
      const employeeIds = await Model.distinct('employeeId');

      let syncedCount = 0;

      for (const employeeId of employeeIds) {
        await syncUserPermissions(employeeId);
        syncedCount++;
      }

      res.status(200).json({
        success: true,
        message: `Successfully synced permissions for ${syncedCount} employees`,
        syncedCount,
      });
    } catch (error) {
      console.error('Error syncing all permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing permissions',
      });
    }
  };

  methods.assignedPlant = async (req, res) => {
    try {
      const { featureName } = req.params;

      if (!featureName) {
        return res.status(400).json({ message: 'featureName is required' });
      }

      // Find all permissions where the employee has the feature and populate plant
      const permissions = await Model.find({
        employeeId: req.admin.id,
        'features.featureName': featureName,
      }).populate({
        path: 'plantId',
        select: 'name _id', // select only name and _id
      });

      // Extract plant info
      const plants = permissions.map(p => p.plantId).filter(Boolean); // remove nulls

      res.json({ success: true, result: plants });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Internal Server error' });
    }
  }

  return methods;
}

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

module.exports = modelController();
