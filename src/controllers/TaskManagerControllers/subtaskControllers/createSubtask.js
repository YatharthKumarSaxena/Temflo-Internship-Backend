const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_CREATED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const createSubtask = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Task = mongoose.model('Task');
    const User = mongoose.model('User'); // ✅ User model for email

    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      links,
      tags,
      storyPointEstimate
    } = req.body;

    if (!title || !storyPointEstimate) {
      return res.status(400).json({ success: false, message: 'All required fields are missing' });
    }

    // 1. Fetch parent task
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Parent Task not found',
      });
    }

    // 2. Extract necessary data from the parent task
    const plantId = task.plantId;
    const workspaceId = task.workspaceId;
    const projectId = task.projectId;

    // 3. Create subtask
    const subtask = new Subtask({
      title,
      description,
      workspaceId,
      projectId,
      taskId: req.params.taskId,
      companyId: req.admin.companyId,
      plantId, 
      status,
      priority,
      assignedTo,
      createdBy: req.admin.id,
      dueDate,
      links,
      tags,
      storyPointEstimate
    });

    await subtask.save();

    // ✅ 4. Activity Tracker logging
    await activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.subtask,
      fileAffected: FILE.file_subtask_create,
      modelAffected: [MODEL_AFFECTED.model_subtask],
      eventType: SUBTASK_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: subtask.toObject(),
    });

    // 🔹 Email Notification (if assignedTo exists)
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser && assignedUser.email) {
        const emailHtml = generateMasterTemplate({
          company_name: req.admin.companyName,
          user_name: assignedUser.name,
          event_name: taskManagerTemplate.subtaskAssignedToEmployee.event_name,
          action: taskManagerTemplate.subtaskAssignedToEmployee.action,
          status: 'Assigned',
          message_intro: `You have been assigned a new subtask.`,
          notes: `
            Subtask Title: ${subtask.title}<br/>
            Task ID: ${task._id}<br/>
            Project ID: ${projectId}<br/>
            Assigned By: ${req.admin.name}<br/>
            Due Date: ${subtask.dueDate || 'N/A'}<br/>
          `,
          actionbutton_text: "View Subtask",
          actionlink: `http://localhost:3000/tasks/${task._id}/subtasks/${subtask._id}`,
          action_link: `http://localhost:3000/tasks/${task._id}/subtasks/${subtask._id}`
        });

        sendEmail(assignedUser.email, taskManagerTemplate.subtaskAssignedToEmployee.subject, emailHtml);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subtask Created Successfully',
    });
  } catch (error) {
    console.error('Subtask Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createSubtask;
