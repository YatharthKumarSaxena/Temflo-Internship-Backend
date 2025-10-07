const Policy = require('../../models/coreModels/Policy')
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { POLICY_UPDATED, POLICY_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

class UpdateController{

    updatePolicy = async (req, res, next) => {
    try {
    const file = req.file;
    const filename = req.file.path;

    const { description, publishedDate } = req.body;

    if (!description || !publishedDate || !file) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newPolicyEntry = {
      description,
      publishedDate,
      file: filename,
    };

    let policy = await Policy.findOne({ companyId: req.admin.companyId });

    if (policy) {
      // Policy document found — push into array
      const oldData = JSON.parse(JSON.stringify(policy.policies));

      policy.policies.push(newPolicyEntry);
      await policy.save();

      const newData = JSON.parse(JSON.stringify(policy.policies));

      // 🔹 Activity Tracker logging
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.policy,
        subModuleAffected: null,
        fileAffected: FILE.file_policy_update,
        modelAffected: [MODEL_AFFECTED.model_policy],
        eventType: POLICY_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldData,
        newData: newData,
        description: `New policy entry added by ${getFullName(req.admin.employeeInfo)}`
      });

      return res.status(200).json({
        success: true,
        message: 'Policy updated successfully',
        policy: policy.policies
      });
    } else {
      // Policy document not found — create a new one
      policy = new Policy({
        companyId: req.admin.companyId,
        policies: [newPolicyEntry]
      });

      await policy.save();

      // 🔹 Activity Tracker logging
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.policy,
        subModuleAffected: null,
        fileAffected: FILE.file_policy_update,
        modelAffected: [MODEL_AFFECTED.model_policy],
        eventType: POLICY_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: policy.toObject(),
        description: `New policy entry created by ${getFullName(req.admin.employeeInfo)}`
      });

      return res.status(201).json({
        success: true,
        message: 'Policy created and policy entry added',
        policy: policy.policies
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error processing policy' });
  }

}

}


module.exports = new UpdateController();