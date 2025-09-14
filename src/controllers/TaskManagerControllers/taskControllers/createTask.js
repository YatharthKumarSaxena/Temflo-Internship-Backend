const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_CREATED } = require("@/config/activity.enums");
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const createTask = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const User = mongoose.model('User');

    const {
      title,
      description,
      plantId,
      status,
      priority,
      assignedTo,
      dueDate,
      links,
      tags,
      storyPointEstimate
    } = req.body;

    if (!title || !plantId || !storyPointEstimate) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const task = new Task({
      title,
      description,
      workspaceId: project.workspaceId,
      projectId: req.params.projectId,
      companyId: req.admin.companyId,
      plantId,
      status,
      priority,
      assignedTo,
      createdBy: req.admin._id,
      dueDate,
      links,
      tags,
      storyPointEstimate
    });

    await task.save();

    // 🔹 Activity Tracker logging
    await activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.task,
      fileAffected: FILE.file_create_task,
      modelAffected: [MODEL_AFFECTED.model_task],
      eventType: TASK_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: task.toObject()
    });

    // 🔹 Send Email to assigned user if assignedTo exists
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser?.email) {
        const taskLink = `http://localhost:3000/projects/${req.params.projectId}/tasks/${task._id}`;
        const html = generateMasterTemplate({
          company_name: req.admin.companyName,
          user_name: assignedUser.name,
          event_name: masterTemplate.taskAssignedToEmployee.event_name,
          action: masterTemplate.taskAssignedToEmployee.action,
          status: 'Assigned',
          message_intro: masterTemplate.taskAssignedToEmployee.message_intro,
          notes: `
            <b>Task Title:</b> ${task.title}<br/>
            <b>Description:</b> ${task.description || '-'}<br/>
            <b>Due Date:</b> ${dueDate || '-'}<br/>
            <b>Assigned By:</b> ${req.admin.name}<br/>
            <b>Date:</b> ${new Date().toLocaleString()}
          `,
          actionbutton_text: 'View Task',
          actionlink: taskLink,
          action_link: taskLink
        });

        sendEmail(assignedUser.email,masterTemplate.taskAssignedToEmployee.subject,html);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Task Created Successfully',
    });
  } catch (error) {
    console.error('Task Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createTask;
