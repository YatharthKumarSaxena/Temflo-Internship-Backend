const mongoose = require('mongoose');
const {
  MODEL_AFFECTED,
  MODULE,
  SUBMODULE,
  ACTIONS,
  FILE
} = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const {
  PROJECT_DELETED,
  TASK_REMOVED,
  SUBTASK_DELETED
} = require('@/config/activity.enums');
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');

    const { projectId } = req.params;
    const { removed } = req.body;

    if (typeof removed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'removed (true/false) must be provided in body',
      });
    }

    // 1. Fetch Project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const newRemovedStatus = removed;
    const projectOldData = { ...project.toObject() };

    // 2. Update all related tasks
    const tasks = await Task.find({ projectId });
    for (const task of tasks) {
      const taskOldData = { ...task.toObject() };

      const subtasks = await Subtask.find({ taskId: task._id });
      for (const subtask of subtasks) {
        const subtaskOldData = { ...subtask.toObject() };

        subtask.removed = newRemovedStatus;
        await subtask.save();

        activityTracker({
          userId: req.user._id,
          companyId: req.user.companyId,
          plantId: req.user.plantId || null,
          module: MODULE.taskManager,
          subModuleAffected: SUBMODULE.project,
          fileAffected: FILE.file_remove_project,
          modelAffected: [MODEL_AFFECTED.model_subtask],
          eventType: SUBTASK_DELETED,
          actionDone: ACTIONS.delete,
          oldData: subtaskOldData,
          newData: {
            removed: newRemovedStatus,
            note: "Soft delete toggled",
          },
          description: `Subtask soft deletion toggled due to project ${removed ? 'deactivation' : 'activation'} by ${getFullName(req.user.employeeInfo)}`
        });
      }

      task.removed = newRemovedStatus;
      await task.save();

      activityTracker({
        userId: req.user._id,
        companyId: req.user.companyId,
        plantId: req.user.plantId || null,
        module: MODULE.taskManager,
        subModuleAffected: SUBMODULE.project,
        fileAffected: FILE.file_remove_project,
        modelAffected: [MODEL_AFFECTED.model_task],
        eventType: TASK_REMOVED,
        actionDone: ACTIONS.delete,
        oldData: taskOldData,
        newData: {
          removed: newRemovedStatus,
          note: "Soft delete toggled",
        },
        description: `Task soft deletion toggled due to project ${removed ? 'deactivation' : 'activation'} by ${getFullName(req.user.employeeInfo)}`
      });
    }

    // 3. Update project
    project.removed = newRemovedStatus;
    await project.save();

    activityTracker({
      userId: req.user._id,
      companyId: req.user.companyId,
      plantId: req.user.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.project,
      fileAffected: FILE.file_remove_project,
      modelAffected: [MODEL_AFFECTED.model_project],
      eventType: PROJECT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: projectOldData,
      newData: {
        removed: newRemovedStatus,
        note: "Soft delete toggled",
      },
      description: `Project ${removed ? 'deactivated' : 'activated'} by ${getFullName(req.user.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: `Project ${removed ? 'deactivated' : 'activated'} successfully`,
    });

  } catch (error) {
    console.error('Toggle Project Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
