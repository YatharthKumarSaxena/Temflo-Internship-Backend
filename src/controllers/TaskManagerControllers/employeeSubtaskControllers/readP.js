const mongoose = require('mongoose');

const readP = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all task, employee is in
      const response = Member.findOne({
        userId: req.admin.id,
        projectId: req.params.projectId,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });

      if (response) {
        const subtasks = await Subtask.find({
          projectId: req.params.projectId,
          companyId: req.admin.companyId,
          removed: false,
        });

        if (subtasks.length == 0) {
          return res.status(200).json({
            success: true,
            subtasks: null,
            message: 'No Subtasks found',
          });
        } else {
          return res.status(200).json({
            success: true,
            subtasks,
            message: 'We found this Subtasks',
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          subtasks: null,
          message: 'No Subtasks found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        subtasks: null,
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

module.exports = readP;
