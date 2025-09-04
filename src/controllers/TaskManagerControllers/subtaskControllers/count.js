const mongoose = require('mongoose');

const count = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const subtaskData = await Subtask.find({
      taskId: req.params.taskId,
      companyId: req.admin.companyId,
      removed: false,
    });

    let count = {
      Total: 0,
      Backlog: 0,
      Todo: 0,
      'In Progress': 0,
      'Under Review': 0,
      'On Hold': 0,
      Completed: 0,
      Progress: 0,
    };

    if (!subtaskData) {
      return res.status(404).json({
        success: false,
        count,
        message: 'Cannot find Subtask',
      });
    }

    if (subtaskData && Array.isArray(subtaskData)) {
      subtaskData.map((subtask) => {
        count.Total = count.Total + 1;
        count[subtask.status] = count[subtask.status] + 1;
      });
    }
    console.log('count', count);

    const progress = (count.Completed / count.Total) * 100;
    count.Progress = parseFloat(progress.toFixed(2));

    return res.status(200).json({
      success: true,
      count,
      message: 'Counting done',
    });
  } catch (error) {
    console.error('Task Count Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = count;
