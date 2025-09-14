const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_UPDATED } = require("@/config/activity.enums");

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

    let newData = {};
    let oldData = {};

    if (name){
      oldData.name = workspace.name;
      workspace.name = name;
      newData.name = name;
    } 
    if (description) {
      oldData.description = workspace.description;
      workspace.description = description;
      newData.description = description;
    }

    await workspace.save();

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
      newData: newData
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