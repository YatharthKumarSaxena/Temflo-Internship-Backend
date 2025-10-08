const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { MEMBER_DELETED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (req, res) => {
  try {
    const Member = mongoose.model('Member');
    const Activity = mongoose.model('Activity');
    const User = mongoose.model('User');

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(404).json({ success: false, message: 'Task Id required To Delete' });
    }

    const member = await Member.findOne({ userId: req.params.userId, taskId, removed: false });
    if (!member) {
      return res.status(404).json({ success: false, message: 'No Member Found To Remove' });
    }

    const memberOldData = { ...member.toObject() };

    member.removed = true;
    await member.save();

    // Activity
    const activity = new Activity({
      companyId: req.admin.companyId,
      plantId: member.plantId,
      workspaceId: member.workspaceId,
      projectId: member.projectId,
      taskId: member.taskId,
      activityBy: req.admin.id,
      message: 'MEMBER REMOVED',
    });
    await activity.save();

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: member.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.member,
      fileAffected: FILE.file_remove_member,
      modelAffected: [MODEL_AFFECTED.model_member],
      eventType: MEMBER_DELETED,
      actionDone: ACTIONS.delete,
      oldData: memberOldData,
      newData: {
        note: "Soft deletion done. Rest fields are same as old data.",
        removed: true
      },
      description: `Member removed from project by ${getFullName(req.admin.employeeInfo)}`
    });

    // ✅ Send Email to the removed member
    const assignedUser = await User.findById(member.userId);
    if (assignedUser && assignedUser.email) {
      const emailHtml = generateMasterTemplate({
        user_name: getFullName(assignedUser.employeeInfo),
        event_name: taskManagerTemplate.employeeRemovedFromProject.event_name,
        action: taskManagerTemplate.employeeRemovedFromProject.action,
        status: 'Removed',
        message_intro: `You have been removed from the project.`,
        notes: `
          Project ID: ${member.projectId}<br/>
          Task ID: ${member.taskId}<br/>
          Removed By: ${getFullName(req.admin.employeeInfo)}<br/>
          Date: ${new Date().toLocaleString()}
        `,
        actionbutton_text: "View Projects",
        actionlink: `http://localhost:3000/projects/${member.projectId}`,
        action_link: `http://localhost:3000/projects/${member.projectId}`
      });

      sendEmail(assignedUser.email, taskManagerTemplate.employeeRemovedFromProject.subject, emailHtml);
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed',
    });
  } catch (error) {
    console.error('Member Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
