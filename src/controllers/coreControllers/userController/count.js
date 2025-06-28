const mongoose = require('mongoose');

// Count Users
const countUsers = async (req, res) => {
  try {
    const User = mongoose.model('User');

    const count = await User.countDocuments({
      companyId: req.admin.companyId,
      removed: false,
      role: { $in: ['admin', 'employee'] },
    });

    return res.status(200).json({
      success: true,
      result: count,
      message: 'User count retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error while counting users',
    });
  }
};

// Count Plants
const countPlants = async (req, res) => {
  try {
    const Plant = mongoose.model('Plant');

    const count = await Plant.countDocuments({
      companyId: req.admin.companyId,
      removed: false,
    });

    return res.status(200).json({
      success: true,
      result: count,
      message: 'Plant count retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error while counting plants',
    });
  }
};

const countAssets = async (req, res) => {
  try {
    const Asset = mongoose.model('Asset');

    const count = await Asset.countDocuments({
      companyId: req.admin.companyId
    });

    return res.status(200).json({
      success: true,
      result: count,
      message: 'Asset count retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error while counting assets',
    });
  }
};

module.exports = {
  countUsers,
  countPlants,
  countAssets
};
