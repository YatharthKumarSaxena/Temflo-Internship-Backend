const mongoose = require('mongoose');

const remove = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');

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

    // 2. Update all related projects
    const projects = await Project.find({ workspaceId: workspace._id });

    for (const project of projects) {
      // 3. Update all tasks under the project
      const tasks = await Task.find({ projectId: project._id });

      for (const task of tasks) {
        // 4. Update all subtasks under the task
        const subtasks = await Subtask.find({ taskId: task._id });
        for (const subtask of subtasks) {
          subtask.removed = newRemovedStatus;
          await subtask.save();
        }

        task.removed = newRemovedStatus;
        await task.save();
      }

      project.removed = newRemovedStatus;
      await project.save();
    }

    // 5. Update the workspace itself
    workspace.removed = newRemovedStatus;
    await workspace.save();

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
