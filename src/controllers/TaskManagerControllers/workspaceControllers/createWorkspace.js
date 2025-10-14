const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

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
      companyId: req.admin.companyId,
      plantId,
      createdBy: req.admin._id,
    });
    await workspace.save();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,              
      companyId: req.admin.companyId,    
      plantId: plantId || null,          
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.workspace,   
      fileAffected: FILE.file_create_workspace, 
      modelAffected: [MODEL_AFFECTED.model_workspace], 
      eventType: WORKSPACE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: workspace.toObject(),
      description: `New workspace created by ${getFullName(req.admin.employeeInfo)}`
    });

    // 🔹 Email Notification to Admins
    const adminUsers = await mongoose.model('User').find({
      companyId: req.admin.companyId,
      plantId: plantId,
      role: 'admin'
    });
    
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const workspaceLink = `${baseUrl}task-manager/workspaces/${workspace._id}`;

    for (const admin of adminUsers) {
      const emailBody = generateMasterTemplate({
        ...taskManagerTemplate.workspaceCreated,
        user_name: getFullName(admin.employeeInfo),
        message_intro: `A new workspace named '${name}' has been created by ${getFullName(req.admin.employeeInfo)}.`,
        action_link: workspaceLink,
        actionLink: workspaceLink,
        actionbutton_text: 'View Workspace'
      });

      if (admin.email) {
        sendEmail(admin.email, taskManagerTemplate.workspaceCreated.subject, emailBody);
      }
    }

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