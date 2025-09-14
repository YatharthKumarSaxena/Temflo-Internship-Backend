const mongoose = require('mongoose');

const readP = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all task, employee is in
      const response = Member.findOne({
        userId: req.admin.id,
        projectId,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });

      if (response.length > 0) {
        const tasks = await Task.find({
          projectId: req.params.projectId,
          companyId: req.admin.companyId,
          removed: false,
        });

        if (tasks.length == 0) {
          return res.status(404).json({
            success: false,
            tasks: null,
            message: 'No Tasks found',
          });
        } else {
          return res.status(200).json({
            success: true,
            tasks,
            message: 'We found this Tasks',
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          tasks: null,
          message: 'No Tasks found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        tasks: null,
        message: 'You are not an employee',
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

module.exports = readP;
