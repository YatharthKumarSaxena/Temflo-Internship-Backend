const mongoose = require('mongoose');

const readAllPolicies = async (req, res) => {
  try {
    const Policy = mongoose.model('Policy');

    const policies = await Policy.find({
      companyId: req.admin.companyId
    }).exec();

    if (!policies || policies.length === 0) {
      return res.status(200).json({
        success: true,
        result: [],
        message: 'No policies found for your company.',
      });
    }

    return res.status(200).json({
      success: true,
      result: policies,
      message: 'Policies fetched successfully.',
    });

  } catch (error) {
    console.error('Error fetching policies:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Internal server error',
    });
  }
};

module.exports = readAllPolicies;
