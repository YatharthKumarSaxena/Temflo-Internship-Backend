const User = require('../../../models/userModels/User');

const create = async (Model, req, res) => {
  try {
    const { departmentCode, description } = req.body;
    const companyId = req.admin.companyId;

    // Validate departmentCode → 1-6 alphanumeric characters (letters and/or digits)
    if (!departmentCode || !/^[A-Za-z0-9]{1,6}$/.test(departmentCode)) {
      return res.status(400).json({
        success: false,
        message: 'Department Code must be 1-6 letters and/or digits.',
      });
    }

    // Validate description → must be a non-empty string
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be a non-empty string.',
      });
    }

    req.body.removed = false;

    // Create the new business segment
    const result = await new Model({
      ...req.body,
      companyId,
    }).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully Added Department',
    });
  } catch (error) {
    console.error('Error adding Department:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = create;
