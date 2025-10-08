const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WORKSPACE_DELETED, PROJECT_DELETED, TASK_REMOVED, SUBTASK_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const remove = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');
    const User = mongoose.model('User');

    const { workspaceId } = req.params;
    const { removed } = req.body; // true => activate, false => deactivate
    if (typeof removed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'activate (true/false) must be provided in body',
      });
    }

    // 1. Find workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const newRemovedStatus = removed;

    // --- Capture workspace oldData
    const workspaceOldData = { ...workspace.toObject() };

    // 2. Update all related projects
    const projects = await Project.find({ workspaceId: workspace._id });
    for (const project of projects) {
      // Capture old project data
      const projectOldData = { ...project.toObject() };

      // 3. Update all tasks under the project
      const tasks = await Task.find({ projectId: project._id });
      for (const task of tasks) {
        const taskOldData = { ...task.toObject() };

        // 4. Update all subtasks under the task
        const subtasks = await Subtask.find({ taskId: task._id });
        for (const subtask of subtasks) {
          const subtaskOldData = { ...subtask.toObject() };
          subtask.removed = newRemovedStatus;
          await subtask.save();

          // Activity tracker for Subtask soft delete
          activityTracker({
            userId: req.admin._id,
            companyId: req.admin.companyId,
            plantId: req.admin.plantId || null,
            module: MODULE.taskManager,
            subModuleAffected: SUBMODULE.workspace,
            fileAffected: FILE.file_remove_workspace,
            modelAffected: [MODEL_AFFECTED.model_subtask],
            eventType: SUBTASK_DELETED,
            actionDone: ACTIONS.delete,
            oldData: subtaskOldData,
            newData: {
              note: "Soft deletion toggled",
              removed: newRemovedStatus
            },
            description: `Subtask ${newRemovedStatus ? 'activated' : 'deactivated'} by ${getFullName(req.admin.employeeInfo)} due to workspace ${newRemovedStatus ? 'activation' : 'deactivation'}`
          });
          if (subtask.assignedTo) {
            const assignedUser = await User.findById(subtask.assignedTo);
            if (assignedUser && assignedUser.email) {
              const emailHtml = generateMasterTemplate({
                user_name: getFullName(assignedUser.employeeInfo),
                event_name: taskManagerTemplate.subtaskRemovedFromEmployee.event_name,
                action: taskManagerTemplate.subtaskRemovedFromEmployee.action,
                status: 'Removed',
                message_intro: `A subtask assigned to you has been removed due to Workspace deletion by Admin.`,
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

        task.removed = newRemovedStatus;
        await task.save();

        // Activity tracker for Task soft delete
        activityTracker({
          userId: req.admin._id,
          companyId: req.admin.companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.taskManager,
          subModuleAffected: SUBMODULE.workspace,
          fileAffected: FILE.file_remove_workspace,
          modelAffected: [MODEL_AFFECTED.model_task],
          eventType: TASK_REMOVED,
          actionDone: ACTIONS.delete,
          oldData: taskOldData,
          newData: {
            note: "Soft deletion toggled",
            removed: newRemovedStatus
          },
          description: `Task ${newRemovedStatus ? 'activated' : 'deactivated'} by ${getFullName(req.admin.employeeInfo)} due to workspace ${newRemovedStatus ? 'activation' : 'deactivation'}`
        });

        const previousAssignedTo = task.assignedTo;
        if (previousAssignedTo) {
          const assignedUser = await User.findById(previousAssignedTo);
          if (assignedUser?.email) {
            const html = generateMasterTemplate({
              user_name: getFullName(assignedUser.employeeInfo),
              event_name: taskManagerTemplate.taskUnassignedFromEmployee.event_name,
              action: taskManagerTemplate.taskUnassignedFromEmployee.action,
              status: 'Removed',
              message_intro: `A task assigned to you has been removed due to Workspace deletion by Admin.`,
              notes: `
                    Task Title: ${task.title}<br/>
                    Removed By: ${getFullName(req.admin.employeeInfo)}<br/>
                    Date: ${new Date().toLocaleString()}
                  `
            });
            sendEmail(assignedUser.email, taskManagerTemplate.taskUnassignedFromEmployee.subject, html);
          }
        }
      }

      project.removed = newRemovedStatus;
      await project.save();

      // Activity tracker for Project soft delete
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.taskManager,
        subModuleAffected: SUBMODULE.workspace,
        fileAffected: FILE.file_remove_workspace,
        modelAffected: [MODEL_AFFECTED.model_project],
        eventType: PROJECT_DELETED,
        actionDone: ACTIONS.delete,
        oldData: projectOldData,
        newData: {
          note: "Soft deletion toggled",
          removed: newRemovedStatus
        },
        description: `Project ${newRemovedStatus ? 'activated' : 'deactivated'} by ${getFullName(req.admin.employeeInfo)} due to workspace ${newRemovedStatus ? 'activation' : 'deactivation'}`
      });
    }

    // 5. Update the workspace itself
    workspace.removed = newRemovedStatus;
    await workspace.save();

    // --- Activity Tracker for Workspace
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.workspace,
      fileAffected: FILE.file_remove_workspace,
      modelAffected: [MODEL_AFFECTED.model_workspace],
      eventType: WORKSPACE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: workspaceOldData,
      newData: {
        note: "Soft deletion toggled",
        removed: newRemovedStatus
      },
      description: `Workspace ${newRemovedStatus ? 'activated' : 'deactivated'} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: `Workspace ${removed ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Workspace Toggle Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;