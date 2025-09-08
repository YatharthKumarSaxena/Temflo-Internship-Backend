const mongoose = require('mongoose');

const readAll = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const task = await Task.find({
      workspaceId: req.params.workspaceId,
      companyId: req.admin.companyId,
      removed: false,
    })
      .populate('workspaceId')
      .populate('projectId')
      .populate('assignedTo')
      .populate('createdBy')

      console.log("first")
      console.log(task)

    if (!task) {
      return res.status(404).json({
        success: false,
        task: null,
        message: 'No Task found',
      });
    } else {
      return res.status(200).json({
        success: true,
        task: task,
        message: 'We found this Task',
      });
    }
  } catch (error) {
    console.error('Task Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = readAll;
