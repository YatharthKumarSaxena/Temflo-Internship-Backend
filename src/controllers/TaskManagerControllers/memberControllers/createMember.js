const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { MEMBER_CREATED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const createMember = async (req, res) => {
  try {
    const Member = mongoose.model('Member');
    const Workspace = mongoose.model('Workspace');
    const Project = mongoose.model('Project');
    const User = mongoose.model('User');

    const { userId, workspaceId, projectId, taskId } = req.body;

    if (!userId || !workspaceId || !projectId) {
      return res.status(400).json({ success: false, message: 'All required fields missing' });
    }

    // 1. Fetch workspace to get plantId
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const plantId = workspace.plantId;

    // 2. Check if member already exists
    const prevMember = await Member.findOne({ projectId, userId });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000/';
    const projectLink = `${baseUrl}projects/${projectId}`;

    if (prevMember) {
      if (prevMember.removed === true) {
        prevMember.removed = false;
        await prevMember.save();

        const requestDate = new Date().toLocaleString();
        const projectDetails = `
        Project Name: ${project?.name || 'N/A'}<br/>
        Project ID: ${projectId}<br/>
        Workspace: ${workspace.name}<br/>
        Assigned By: ${getFullName(req.admin.employeeInfo)}<br/>
        Date: ${requestDate}
      `;

        const emailHtml = generateMasterTemplate({
          user_name: getFullName(prevMember.employeeInfo),
          event_name: taskManagerTemplate.employeeAssignedToProject.event_name,
          action: taskManagerTemplate.employeeAssignedToProject.action,
          status: 'Assigned',
          message_intro: `You have been reassigned to this project.`,
          notes: projectDetails,
          actionbutton_text: "View Project",
          actionlink: projectLink,
          action_link: projectLink
        });

        sendEmail(prevMember.email, taskManagerTemplate.employeeAssignedToProject.subject, emailHtml);

        return res.status(200).json({ success: true, message: 'Previous Member Found, Readded Successfully' });
      }
      return res.status(200).json({ success: true, message: 'Previous Member Found, Cannot Readd' });
    }

    // 3. Create new member
    const member = new Member({
      userId,
      workspaceId,
      projectId,
      companyId: req.admin.companyId,
      plantId,
    });

    await member.save();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.member,
      fileAffected: FILE.file_create_member,
      modelAffected: [MODEL_AFFECTED.model_member],
      eventType: MEMBER_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: member.toObject(),
      description: `Member added to project by ${getFullName(req.admin.employeeInfo)}`
    });

    // 🔹 Email Notification (Employee Assigned to Project)
    const assignedUser = await User.findById(userId); 
    const project = await Project.findById(projectId); // fetch project name/details

    if (assignedUser && assignedUser.email) {
      const requestDate = new Date().toLocaleString();
      const projectDetails = `
        Project Name: ${project?.name || 'N/A'}<br/>
        Project ID: ${projectId}<br/>
        Workspace: ${workspace.name}<br/>
        Assigned By: ${getFullName(req.admin.employeeInfo)}<br/>
        Date: ${requestDate}
      `;

      const emailHtml = generateMasterTemplate({
        user_name: getFullName(assignedUser.employeeInfo),
        event_name: taskManagerTemplate.employeeAssignedToProject.event_name,
        action: taskManagerTemplate.employeeAssignedToProject.action,
        status: 'Assigned',
        message_intro: `You have been assigned to a new project.`,
        notes: projectDetails,
        actionbutton_text: "View Project",
        actionlink: projectLink,
        action_link: projectLink
      });

      sendEmail(assignedUser.email, taskManagerTemplate.employeeAssignedToProject.subject, emailHtml);
    }

    return res.status(200).json({
      success: true,
      message: 'Member Added Successfully',
    });

  } catch (error) {
    console.error('Member Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createMember;
