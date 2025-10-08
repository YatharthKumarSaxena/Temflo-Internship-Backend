const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_UPDATED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const User = mongoose.model('User');

    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      links,
      tags,
      storyPointEstimate,
      comment,
    } = req.body;

    const subtask = await Subtask.findOne({ _id: req.params.subtaskId });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'No Subtask Found To Update',
      });
    }

    const oldData = subtask.toObject();

    const previousAssignedTo = subtask.assignedTo;

    // 🔹 Apply updates
    if (title) subtask.title = title;
    if (description) subtask.description = description;
    if (status) subtask.status = status;
    if (priority) subtask.priority = priority;
    if (assignedTo) subtask.assignedTo = assignedTo;
    if (dueDate) subtask.dueDate = dueDate;
    if (links) subtask.links = links;
    if (tags) subtask.tags = tags;
    if (storyPointEstimate) subtask.storyPointEstimate = storyPointEstimate;
    if (comment) {
      const prevComments = subtask.comments;
      subtask.comments = prevComments ? [...prevComments, comment] : [comment];
    }

    await subtask.save();

    const newData = subtask.toObject();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin?._id,
      companyId: req.admin?.companyId,
      plantId: req.admin?.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.subtask,
      fileAffected: FILE.file_subtask_update,
      modelAffected: [MODEL_AFFECTED.model_subtask],
      eventType: SUBTASK_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: newData,
      description: `Subtask updated by ${getFullName(req.admin.employeeInfo)}`
    });

    // ---- EMAIL INTEGRATION ----
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const subtaskLink = `${baseUrl}subtasks/${subtask._id}`;
    const assignedUser = await User.findById(subtask.assignedTo);

    // 🔹 Email Notifications if assignedTo changed
    if (assignedTo && assignedTo.toString() !== previousAssignedTo?.toString()) {
      // 1️⃣ Email to new assigned user
      if (assignedTo) {
        if (assignedUser?.email) {
          const html = generateMasterTemplate({
            user_name: getFullName(assignedUser.employeeInfo),
            event_name: taskManagerTemplate.subtaskAssignedToEmployee.event_name,
            action: taskManagerTemplate.subtaskAssignedToEmployee.action,
            status: 'Assigned',
            message_intro: `A subtask has been assigned to you.`,
            notes: `
              Subtask Title: ${subtask.title}<br/>
              Task ID: ${subtask.taskId}<br/>
              Project ID: ${subtask.projectId}<br/>
              Assigned By: ${getFullName(req.admin.employeeInfo)}<br/>
              Date: ${new Date().toLocaleString()}
            `,
            actionbutton_text: "View Subtask",
            actionlink: subtaskLink,
            action_link: subtaskLink
          });
          sendEmail(assignedUser.email, taskManagerTemplate.subtaskAssignedToEmployee.subject, html);
        }
      }

      // 2️⃣ Email to previous assigned user about removal
      if (previousAssignedTo) {
        const oldUser = await User.findById(previousAssignedTo);
        if (oldUser?.email) {
          const html = generateMasterTemplate({
            user_name: getFullName(oldUser.employeeInfo),
            event_name: taskManagerTemplate.subtaskRemovedFromEmployee.event_name,
            action: taskManagerTemplate.subtaskRemovedFromEmployee.action,
            status: 'Removed',
            message_intro: `You have been unassigned from a subtask.`,
            notes: `
              Subtask Title: ${subtask.title}<br/>
              Task ID: ${subtask.taskId}<br/>
              Project ID: ${subtask.projectId}<br/>
              Removed By: ${getFullName(req.admin.employeeInfo)}<br/>
              Date: ${new Date().toLocaleString()}
            `
          });
          sendEmail(oldUser.email, taskManagerTemplate.subtaskRemovedFromEmployee.subject, html);
        }
      }
    }

    // 🔹 Email Notifications if a comment is added
    if (comment && subtask.assignedTo) {
      if (assignedUser?.email) {
        const html = generateMasterTemplate({
          user_name: getFullName(assignedUser.employeeInfo),
          event_name: taskManagerTemplate.subtaskCommentAdded.event_name,
          action: taskManagerTemplate.subtaskCommentAdded.action,
          status: 'Comment Added',
          message_intro: `A new comment has been added to a subtask assigned to you.`,
          notes: `
        Subtask Title: ${subtask.title}<br/>
        Task ID: ${subtask.taskId}<br/>
        Project ID: ${subtask.projectId}<br/>
        Comment: ${comment}<br/>
        Added By: ${getFullName(req.admin.employeeInfo)}<br/>
        Date: ${new Date().toLocaleString()}
      `,
          actionbutton_text: "View Subtask",
          actionlink: subtaskLink,
          action_link: subtaskLink
        });
        sendEmail(assignedUser.email, taskManagerTemplate.subtaskCommentAdded.subject, html);
      }
    }

    // 🔹 Email notification for status change
    if (status && subtask.assignedTo && oldData.status !== status) {
      if (assignedUser?.email) {
        const html = generateMasterTemplate({
          user_name: getFullName(assignedUser.employeeInfo),
          event_name: taskManagerTemplate.subtaskStatusUpdated.event_name,
          action: taskManagerTemplate.subtaskStatusUpdated.action,
          status: `Status Changed to ${status}`,
          message_intro: taskManagerTemplate.subtaskStatusUpdated.message_intro,
          actionbutton_text: taskManagerTemplate.subtaskStatusUpdated.actionbutton_text || "View Subtask",
          actionlink: subtaskLink,
          action_link: subtaskLink
        });
        sendEmail(assignedUser.email, taskManagerTemplate.subtaskStatusUpdated.subject, html);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subtask Updated Successfully',
    });
  } catch (error) {
    console.error('Subtask Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;
