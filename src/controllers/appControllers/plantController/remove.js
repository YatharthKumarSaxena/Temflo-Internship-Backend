const User = require('../../../models/userModels/User'); // import your Employee/User model

const remove = async (Model, req, res) => {
  try {
    const id = req.admin._id;

    // Soft delete the Plant (or the given Model)
    const updatedPlant = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId: req.admin.companyId },
      { removed: true },
      { new: true }
    );

    if (!updatedPlant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found or you do not have access to delete this Plant.',
      });
    }

    // Soft delete employees under this Plant
    await User.updateMany(
      { plantId: req.params.id, companyId: req.admin.companyId },
      { removed: true }
    );

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
