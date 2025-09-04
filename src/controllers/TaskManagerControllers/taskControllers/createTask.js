const mongoose = require('mongoose');

const createTask = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
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

    // 1. Fetch project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 2. Get workspaceId and plantId from project
    const workspaceId = project.workspaceId;
    const plantId = project.plantId;

    // 3. Create task
    const task = new Task({
      title,
      description,
      workspaceId,
      projectId: req.params.projectId,
      companyId: req.admin.companyId,
      plantId, // ✅ fetched from project
      status,
      priority,
      assignedTo,
      createdBy: req.admin.id,
      dueDate,
      links,
      tags,
      storyPointEstimate,
    });

    console.log('task', task);
    await task.save();

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
