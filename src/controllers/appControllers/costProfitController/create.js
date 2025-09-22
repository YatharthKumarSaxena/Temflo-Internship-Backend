const create = async (Model, req, res) => {
  try {
    const { costProfitCode, description } = req.body;
    const companyId = req.admin.companyId;

    // Validate costProfitCode → 1-5 alphanumeric characters (letters and/or digits)
    if (!costProfitCode || !/^[A-Za-z0-9]{1,5}$/.test(costProfitCode)) {
      return res.status(400).json({
        success: false,
        message: 'Cost/Profit Code must be 1-5 letters and/or digits.',
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
      message: 'Successfully Added Cost/Profit Center',
    });
  } catch (error) {
    console.error('Error adding Business Segment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = create;
