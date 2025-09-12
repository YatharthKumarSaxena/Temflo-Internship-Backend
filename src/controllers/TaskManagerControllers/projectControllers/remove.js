const mongoose = require('mongoose');

const remove = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');

    const { projectId } = req.params;
    const { removed } = req.body; // true => activate, false => deactivate

    if (typeof removed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'activate (true/false) must be provided in body',
      });
    }

    // 1. Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const newRemovedStatus = removed;

    // 2. Update all tasks under the project
    const tasks = await Task.find({ projectId: project._id });

    for (const task of tasks) {
      // 3. Update all subtasks under the task
      const subtasks = await Subtask.find({ taskId: task._id });

      for (const subtask of subtasks) {
        subtask.removed = newRemovedStatus;
        await subtask.save();
      }

      task.removed = newRemovedStatus;
      await task.save();
    }

    // 4. Update the project itself
    project.removed = newRemovedStatus;
    await project.save();

    return res.status(200).json({
      success: true,
      message: `Project ${removed ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Project Toggle Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
