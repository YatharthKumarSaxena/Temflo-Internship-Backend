const mongoose = require('mongoose');

const getName = async (req, res, { userModel }) => {
    const UserModel = mongoose.model(userModel);

    const user = await UserModel.findOne(
      { companyId: req.params.id, removed: false },
      'companyId name' // Project only companyId and name
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No Company found with this Id.',
      });
    }

    return res.status(200).json({
      success: true,
      result: user,
      message: 'Company data retrieved successfully.',
    });
  
};

module.exports = getName;
