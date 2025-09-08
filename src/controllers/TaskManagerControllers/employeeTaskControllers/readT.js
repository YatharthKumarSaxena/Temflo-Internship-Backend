const mongoose = require('mongoose');

const readT = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      const task = await Task.findOne({
        _id: req.params.taskId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          task: null,
          message: 'No Task found',
        });
      }

      const response = Member.findOne({
        userId: req.admin.id,
        projectId: task.projectId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (response) {
        return res.status(200).json({
          success: true,
          task,
          message: 'We found this Task',
        });
      } else {
        return res.status(404).json({
          success: false,
          task: null,
          message: 'No Task found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        task: null,
        message: 'You are not an employee',
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
