const mongoose = require('mongoose');

const readT = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      const subtask = await Subtask.find({
        taskId: req.params.taskId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!subtask) {
        return res.status(200).json({
          success: true,
          subtask: null,
          message: 'No Subtask found',
        });
      }

      const response = Member.findOne({
        userId: req.admin.id,
        projectId: subtask.projectId,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (response) {
        return res.status(200).json({
          success: true,
          subtask,
          message: 'We found this Subtask',
        });
      } else {
        return res.status(200).json({
          success: true,
          subtask: null,
          message: 'No Subtask found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        subtask: null,
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
