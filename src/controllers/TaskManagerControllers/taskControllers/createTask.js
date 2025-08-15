const mongoose = require('mongoose');

const createTask = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');

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
    if (!title  || !plantId || !storyPointEstimate) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const p = await Project.findOne({ _id: req.params.projectId });
    if (!p) {
      return res.status(500).json({
        success: false,
        message: 'Cannot Find Project',
      });
    }
    const workspaceId = p.workspaceId
    const task = new Task({
      title,
      description,
      workspaceId,
      projectId: req.params.projectId,
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
    console.log('task', task);
    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task Created Successfully',
    });
  } catch (error) {
    console.log('Task Creation Error', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createTask;
