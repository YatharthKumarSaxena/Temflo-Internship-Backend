const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

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
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.workspace,
      fileAffected: FILE.file_update_workspace,
      modelAffected: [MODEL_AFFECTED.model_workspace],
      eventType: WORKSPACE_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: newData,
      description: `Workspace updated by ${getFullName(req.admin.employeeInfo)}`
    });

    // Email Integration
    const adminUsers = await mongoose.model('User').find({
      companyId: req.admin.companyId,
      plantId: plantId,
      role: 'admin'
    });
    
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const workspaceLink = `${baseUrl}task-manager/workspaces/${workspace._id}`;

    for (const admin of adminUsers) {
      const emailBody = generateMasterTemplate({
        ...taskManagerTemplate.workspaceUpdated,
        user_name: getFullName(admin.employeeInfo),
        message_intro: `The workspace named '${name}' has been updated by ${getFullName(req.admin.employeeInfo)}.`,
        action_link: workspaceLink,
        actionLink: workspaceLink,
        actionbutton_text: 'View Workspace'
      });

      if (admin.email) {
        sendEmail(admin.email, taskManagerTemplate.workspaceUpdated.subject, emailBody);
      }
    }

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