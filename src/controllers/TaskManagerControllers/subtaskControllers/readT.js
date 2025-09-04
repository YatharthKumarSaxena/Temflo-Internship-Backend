const mongoose = require('mongoose');

const readT = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const subtask = await Subtask.find({
      taskId: req.params.taskId,
      companyId: req.admin.companyId,
      removed: false,
    })
      .populate('workspaceId')
      .populate('projectId')
      .populate('taskId')
      .populate('assignedTo')
      .populate('createdBy')

    if (!subtask) {
      return res.status(404).json({
        success: false,
        subtask: null,
        message: 'No Subtask found',
      });
    } else {
      return res.status(200).json({
        success: true,
        subtask,
        message: 'We found this Subtask',
      });
    }
  } catch (error) {
    console.error('Subtask Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = readT;
