const mongoose = require('mongoose');

const remove= async ( req, res) => {
    try {
  const Policy = mongoose.model('Policy');
  const companyId = req.admin.companyId;
  const policyId = req.params.policyId;      // ID of the parent Policy document

  const updatedPolicy = await Policy.findOneAndUpdate(
    { companyId: companyId },
    { $pull: { policies: { _id: policyId } } },
    { new: true }
  );

  if (!updatedPolicy) {
    return res.status(404).json({
      success: false,
      message: 'Policy not found or you do not have access to delete this entry.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Policy entry deleted successfully',
    policy: updatedPolicy.policies
  });
} catch (error) {
  console.error('Delete Policy Entry Error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

  };
  
  module.exports = remove;
  