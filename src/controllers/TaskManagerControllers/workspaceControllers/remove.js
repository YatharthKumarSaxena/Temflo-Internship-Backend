const mongoose = require('mongoose');

const remove = async (req, res) => {
  // params workspaceId
  try {
    const Workspace = mongoose.model('Workspace');
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');

    const workspace = await Workspace.findOne({ _id: req.params.workspaceId, removed: false });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'No Workspace Found To Delete',
      });
    }

    const project = await Project.find({ _id: req.params.workspaceId, removed: false });
    if (project) {
      project.map(async (p) => {
        const task = await Task.find({ _id: p._id, removed: false });
        task?.map(async (taskId) => {
          const task = await Task.findOne({ _id: taskId });
          task.removed = true;
          await task.save();
        });
        p.removed = true;
        await p.save()
      });
    }
    
    workspace.removed = true;
    await workspace.save();

    return res.status(200).json({
      success: true,
      message: 'Workspace Deleted Successfully',
    });
  } catch (error) {
    console.error('Workspace Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
