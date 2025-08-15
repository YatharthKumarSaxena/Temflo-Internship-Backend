const mongoose = require('mongoose');

const remove = async (req, res) => {
  // params projectId
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');

    const project = await Project.findOne({ _id: req.params.projectId, removed: false });

    if (!project) {
        return res.status(404).json({
        success: false,
        message: 'No Project Found To Delete',
      });
    }

    const task = await Task.find({ projectId: req.params.projectId, removed: false });

    // To Delete Task
    task?.map(async (taskId) => {
        const task = await Task.findOne({_id:taskId})
        task.removed = true
        await task.save()
    })

    // To Delete Project
    project.removed = true 
    await project.save()

    return res.status(200).json({
      success: true,
      message: 'Project Deleted Successfully',
    });
  } catch (error) {
    console.error('Project Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;