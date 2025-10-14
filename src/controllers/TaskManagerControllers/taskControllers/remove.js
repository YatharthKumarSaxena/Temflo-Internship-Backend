const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_REMOVED, SUBTASK_DELETED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');
    const User = mongoose.model('User');

    // 🔹 Fetch Task
    const task = await Task.findOne({ _id: req.params.taskId, removed: false });
    if (!task) {
      return res.status(404).json({ success: false, message: 'No Task Found To Delete' });
    }

    const previousAssignedTo = task.assignedTo;

    // 🔹 Fetch Subtasks
    const subtasks = await Subtask.find({ taskId: task._id, removed: false });

    // 🔹 Soft delete Subtasks
    for (const subtask of subtasks) {
      subtask.removed = true;
      // ✅ Activity Tracker logging
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.taskManager,
        subModuleAffected: SUBMODULE.task,
        fileAffected: FILE.file_remove_task,
        modelAffected: [MODEL_AFFECTED.model_subtask],
        eventType: SUBTASK_DELETED,
        actionDone: ACTIONS.delete,
        oldData: subtask.toObject(),
        newData: {
          note: "Soft delete performed",
          removed: true
        },
        description: `Subtask deleted due to task deletion by ${getFullName(req.admin.employeeInfo)}`
      });
      await subtask.save();
      // 🔹 Email Notification (if assignedTo exists)
      if (subtask.assignedTo) {
        const assignedUser = await User.findById(subtask.assignedTo);
        if (assignedUser && assignedUser.email) {
          const emailHtml = generateMasterTemplate({
            user_name: getFullName(assignedUser.employeeInfo),
            event_name: taskManagerTemplate.subtaskRemovedFromEmployee.event_name,
            action: taskManagerTemplate.subtaskRemovedFromEmployee.action,
            status: 'Removed',
            message_intro: `A subtask assigned to you has been removed due to task deletion by Admin.`,
            notes: `
                  Subtask Title: ${subtask.title}<br/>
                  Task ID: ${subtask.taskId}<br/>
                  Project ID: ${subtask.projectId}<br/>
                  Removed By: ${getFullName(req.admin.employeeInfo)}<br/>
                  Date: ${new Date().toLocaleString()}
                `
            // ✅ No action button/link sent
          });

          sendEmail(assignedUser.email, taskManagerTemplate.subtaskRemovedFromEmployee.subject, emailHtml);
        }
      }
    }

    // 🔹 Soft delete Task
    task.removed = true;
    await task.save();

    // 🔹 Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.task,
      fileAffected: FILE.file_remove_task,
      modelAffected: [MODEL_AFFECTED.model_task],
      eventType: TASK_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: task.toObject(),
      newData: { note: "Soft deletion performed", removed: true },
      description: `Task deleted by ${getFullName(req.admin.employeeInfo)}`
    });

    // 🔹 Email to previously assigned user
    if (previousAssignedTo) {
      const assignedUser = await User.findById(previousAssignedTo);
      if (assignedUser?.email) {
        const html = generateMasterTemplate({
          user_name: getFullName(assignedUser.employeeInfo),
          event_name: taskManagerTemplate.taskUnassignedFromEmployee.event_name,
          action: taskManagerTemplate.taskUnassignedFromEmployee.action,
          status: 'Removed',
          message_intro: `A task assigned to you has been removed due to task deletion by Admin.`,
          notes: `
            Task Title: ${task.title}<br/>
            Removed By: ${getFullName(req.admin.employeeInfo)}<br/>
            Date: ${new Date().toLocaleString()}
          `
        });
        sendEmail(assignedUser.email, taskManagerTemplate.taskUnassignedFromEmployee.subject, html);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Task Deleted Successfully',
    });

  } catch (error) {
    console.error('Task Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;