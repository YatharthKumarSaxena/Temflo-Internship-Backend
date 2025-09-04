const mongoose = require('mongoose');

const createSubtask = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Task = mongoose.model('Task');

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
      plantId, // ✅ taken from task
      status,
      priority,
      assignedTo,
      createdBy: req.admin.id,
      dueDate,
      links,
      tags,
      storyPointEstimate
    });

    console.log('subtask', subtask);
    await subtask.save();

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
