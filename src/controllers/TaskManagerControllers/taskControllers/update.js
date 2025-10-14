const mongoose = require('mongoose');
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (req, res) => {
  // params TaskId
  try {
    const Task = mongoose.model('Task');
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
      comment
    } = req.body;

    const task = await Task.findOne({ _id: req.params.taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Update',
      });
    }

    const oldData = task.toObject();

    const previousAssignedTo = task.assignedTo;

    if (title && task.title !== title) {
      task.title = title;
    }

    if (description && task.description !== description) {
      task.description = description;
    }

    if (status && task.status !== status) {
      task.status = status;
    }

    if (priority && task.priority !== priority) {
      task.priority = priority;
    }

    if (assignedTo && String(task.assignedTo) !== String(assignedTo)) {
      task.assignedTo = assignedTo;
    }

    if (dueDate && task.dueDate?.toString() !== new Date(dueDate).toString()) {
      task.dueDate = dueDate;
    }

    if (links && JSON.stringify(task.links) !== JSON.stringify(links)) {
      task.links = links;
    }

    if (tags && JSON.stringify(task.tags) !== JSON.stringify(tags)) {
      task.tags = tags;
    }

    if (storyPointEstimate && task.storyPointEstimate !== storyPointEstimate) {
      task.storyPointEstimate = storyPointEstimate;
    }

    console.log("first", comment)
    if (comment) {
      const prevComments = task.comments || [];
      const newComments = [...prevComments, comment];
      task.comments = newComments;
    }

    const newData = task.toObject();

    await task.save();

    if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.taskManager,
        subModuleAffected: SUBMODULE.task,
        fileAffected: FILE.file_update_task,
        modelAffected: [MODEL_AFFECTED.model_task],
        eventType: TASK_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldData,
        newData: newData,
        description: `Task updated by ${getFullName(req.admin.employeeInfo)}`
      });
    }

    // ---- EMAIL INTEGRATION ----
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const taskLink = `${baseUrl}tasks/${task._id}`;
    const newUser = await User.findById(task.assignedTo);

    // 🔹 Email logic for assigned/unassigned
    if (assignedTo && String(assignedTo) !== String(previousAssignedTo)) {
      // Email to new assigned user
        if (newUser?.email) {
          const html = generateMasterTemplate({
            user_name: getFullName(newUser.employeeInfo),
            event_name: taskManagerTemplate.taskAssignedToEmployee.event_name,
            action: taskManagerTemplate.taskAssignedToEmployee.action,
            status: 'Assigned',
            message_intro: taskManagerTemplate.taskAssignedToEmployee.message_intro,
            notes: `Task Title: ${task.title}<br/>Assigned By: ${getFullName(req.admin.employeeInfo)}<br/>Date: ${new Date().toLocaleString()}`,
            actionbutton_text: taskManagerTemplate.taskAssignedToEmployee.actionbutton_text,
            actionlink: taskLink,
            action_link: taskLink
          });
          sendEmail(newUser.email, taskManagerTemplate.taskAssignedToEmployee.subject, html);
      }

      // Email to previous assigned user
      if (previousAssignedTo) {
        const oldUser = await User.findById(previousAssignedTo);
        if (oldUser?.email) {
          const html = generateMasterTemplate({
            user_name: getFullName(oldUser.employeeInfo),
            event_name: taskManagerTemplate.taskUnassignedFromEmployee.event_name,
            action: taskManagerTemplate.taskUnassignedFromEmployee.action,
            status: 'Removed',
            message_intro: taskManagerTemplate.taskUnassignedFromEmployee.message_intro,
            notes: `Task Title: ${task.title}<br/>Removed By: ${getFullName(req.admin.employeeInfo)}<br/>Date: ${new Date().toLocaleString()}`
          });
          sendEmail(oldUser.email, taskManagerTemplate.taskUnassignedFromEmployee.subject, html);
        }
      }
    }

    // 🔹 Email notification for new comment
    if (comment && task.assignedTo) {
      const assignedUser = await User.findById(task.assignedTo);
      if (assignedUser?.email) {
        const html = generateMasterTemplate({
          user_name: getFullName(assignedUser.employeeInfo),
          event_name: taskManagerTemplate.taskCommentAdded.event_name,
          action: taskManagerTemplate.taskCommentAdded.action,
          status: 'Comment Added',
          message_intro: taskManagerTemplate.taskCommentAdded.message_intro,
          notes: `Task Title: ${task.title}<br/>Comment: ${comment}<br/>Added By: ${getFullName(req.admin.employeeInfo)}<br/>Date: ${new Date().toLocaleString()}`,
          actionbutton_text: taskManagerTemplate.taskCommentAdded.actionbutton_text || "View Task",
          actionlink: taskLink,
          action_link: taskLink
        });
        sendEmail(assignedUser.email, taskManagerTemplate.taskCommentAdded.subject, html);
      }
    }

    // 🔹 Email notification for status change
    if (status && task.assignedTo && oldData.status !== status) {
      if (newUser?.email) {
        const html = generateMasterTemplate({
          user_name: getFullName(newUser.employeeInfo),
          event_name: taskManagerTemplate.taskStatusUpdated.event_name,
          action: taskManagerTemplate.taskStatusUpdated.action,
          status: `Status Changed to ${status}`,
          message_intro: taskManagerTemplate.taskStatusUpdated.message_intro,
          notes: `Task Title: ${task.title}<br/>New Status: ${status}<br/>Updated By: ${getFullName(req.admin.employeeInfo)}<br/>Date: ${new Date().toLocaleString()}`,
          actionbutton_text: taskManagerTemplate.taskStatusUpdated.actionbutton_text || "View Task",
          actionlink: taskLink,
          action_link: taskLink
        });
        sendEmail(newUser.email, taskManagerTemplate.taskStatusUpdated.subject, html);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Task Updated Successfully',
    });
  } catch (error) {
    console.error('Task Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;