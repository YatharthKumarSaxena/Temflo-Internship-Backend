const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const createWorkspace = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const { name, description, plantId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const workspace = new Workspace({
      name,
      description,
      companyId: req.user.companyId,
      plantId,
      createdBy: req.user._id,
    });
    await workspace.save();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.user._id,              
      companyId: req.user.companyId,    
      plantId: plantId || null,          
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.workspace,   
      fileAffected: FILE.file_create_workspace, 
      modelAffected: [MODEL_AFFECTED.model_workspace], 
      eventType: WORKSPACE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: workspace.toObject(),
      description: `New workspace created by ${getFullName(req.user.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Workspace Created Successfully',
      result: workspace
    });
  } catch (error) {
    console.error('Workspace Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createWorkspace;