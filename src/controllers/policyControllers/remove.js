const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { POLICY_REMOVED } = require("@/config/activity.enums");

const remove = async (req, res) => {
  try {
    const Policy = mongoose.model('Policy');
    const companyId = req.admin.companyId;
    const policyId = req.params.policyId;      // ID of the parent Policy document

    const updatedPolicy = await Policy.findOneAndUpdate(
      { companyId: companyId },
      { $pull: { policies: { _id: policyId } } }
    );

    if (!updatedPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found or you do not have access to delete this entry.',
      });
    }

    // --- Activity Tracker 
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.policy,
      subModuleAffected: null,
      fileAffected: FILE.file_policy_remove,
      modelAffected: [MODEL_AFFECTED.model_policy],
      eventType: POLICY_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: updatedPolicy.toObject(),
      newData: {
        deletedPolicyId: req.params.policyId,
        note: "All fields same as Old Data, Soft deletion is Done",
        removed: true
      }
    });

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