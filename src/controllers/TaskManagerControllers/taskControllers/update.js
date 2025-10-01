const mongoose = require('mongoose');
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_UPDATED } = require("@/config/activity.enums");

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

    const previousAssignedTo = task.assignedTo;

    let newData = {};
    let oldData = {};

    if (title && task.title !== title) {
      oldData.title = task.title;
      newData.title = title;
      task.title = title;
    }

    if (description && task.description !== description) {
      oldData.description = task.description;
      newData.description = description;
      task.description = description;
    }

    if (status && task.status !== status) {
      oldData.status = task.status;
      newData.status = status;
      task.status = status;
    }

    if (priority && task.priority !== priority) {
      oldData.priority = task.priority;
      newData.priority = priority;
      task.priority = priority;
    }

    if (assignedTo && String(task.assignedTo) !== String(assignedTo)) {
      oldData.assignedTo = task.assignedTo;
      newData.assignedTo = assignedTo;
      task.assignedTo = assignedTo;
    }

    if (dueDate && task.dueDate?.toString() !== new Date(dueDate).toString()) {
      oldData.dueDate = task.dueDate;
      newData.dueDate = dueDate;
      task.dueDate = dueDate;
    }

    if (links && JSON.stringify(task.links) !== JSON.stringify(links)) {
      oldData.links = task.links;
      newData.links = links;
      task.links = links;
    }

    if (tags && JSON.stringify(task.tags) !== JSON.stringify(tags)) {
      oldData.tags = task.tags;
      newData.tags = tags;
      task.tags = tags;
    }

    if (storyPointEstimate && task.storyPointEstimate !== storyPointEstimate) {
      oldData.storyPointEstimate = task.storyPointEstimate;
      newData.storyPointEstimate = storyPointEstimate;
      task.storyPointEstimate = storyPointEstimate;
    }

    console.log("first",comment)
if (comment) {
  const prevComments = task.comments || [];
  const newComments = [...prevComments, comment];
  oldData.comments = prevComments;
  newData.comments = newComments;
  task.comments = newComments;
}


    await task.save();

if (Object.keys(oldData).length > 0) {
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
    newData: newData
  });
}

    // 🔹 Email logic for assigned/unassigned
    if (assignedTo && String(assignedTo) !== String(previousAssignedTo)) {
      // Email to new assigned user
      if (assignedTo) {
        const newUser = await User.findById(assignedTo);
        if (newUser?.email) {
          const html = generateMasterTemplate({
            company_name: req.admin.companyName,
            user_name: newUser.name,
            event_name: taskManagerTemplate.taskAssignedToEmployee.event_name,
            action: taskManagerTemplate.taskAssignedToEmployee.action,
            status: 'Assigned',
            message_intro: taskManagerTemplate.taskAssignedToEmployee.message_intro,
            notes: `Task Title: ${task.title}<br/>Assigned By: ${req.admin.name}<br/>Date: ${new Date().toLocaleString()}`,
            actionbutton_text: taskManagerTemplate.taskAssignedToEmployee.actionbutton_text,
            actionlink: `http://localhost:3000/tasks/${task._id}`,
            action_link: `http://localhost:3000/tasks/${task._id}`
          });
          sendEmail(newUser.email, taskManagerTemplate.taskAssignedToEmployee.subject, html);
        }
      }

      // Email to previous assigned user
      if (previousAssignedTo) {
        const oldUser = await User.findById(previousAssignedTo);
        if (oldUser?.email) {
          const html = generateMasterTemplate({
            company_name: req.admin.companyName,
            user_name: oldUser.name,
            event_name: taskManagerTemplate.taskUnassignedFromEmployee.event_name,
            action: taskManagerTemplate.taskUnassignedFromEmployee.action,
            status: 'Removed',
            message_intro: taskManagerTemplate.taskUnassignedFromEmployee.message_intro,
            notes: `Task Title: ${task.title}<br/>Removed By: ${req.admin.name}<br/>Date: ${new Date().toLocaleString()}`
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
      company_name: req.admin.companyName,
      user_name: assignedUser.name,
      event_name: taskManagerTemplate.taskCommentAdded.event_name,
      action: taskManagerTemplate.taskCommentAdded.action,
      status: 'Comment Added',
      message_intro: taskManagerTemplate.taskCommentAdded.message_intro,
      notes: `Task Title: ${task.title}<br/>Comment: ${comment}<br/>Added By: ${req.admin.name}<br/>Date: ${new Date().toLocaleString()}`,
      actionbutton_text: taskManagerTemplate.taskCommentAdded.actionbutton_text || "View Task",
      actionlink: `http://localhost:3000/tasks/${task._id}`,
      action_link: `http://localhost:3000/tasks/${task._id}`
    });
    sendEmail(assignedUser.email, taskManagerTemplate.taskCommentAdded.subject, html);
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