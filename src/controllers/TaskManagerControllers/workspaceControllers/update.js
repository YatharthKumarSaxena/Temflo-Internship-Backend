const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const { name, description } = req.body;

    const workspace = await Workspace.findOne({ _id: req.params.workspaceId });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'No Workspace Found To Update',
      });
    }

    const oldData = workspace.toObject();

    if (name){
      workspace.name = name;
    } 
    if (description) {
      workspace.description = description;
    }

    await workspace.save();

    const newData = workspace.toObject();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.user._id,
      companyId: req.user.companyId,
      plantId: req.user.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.workspace,
      fileAffected: FILE.file_update_workspace,
      modelAffected: [MODEL_AFFECTED.model_workspace],
      eventType: WORKSPACE_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: newData,
      description: `Workspace updated by ${getFullName(req.user.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Workspace Updated Successfully',
    });
  } catch (error) {
    console.error('Workspace Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;