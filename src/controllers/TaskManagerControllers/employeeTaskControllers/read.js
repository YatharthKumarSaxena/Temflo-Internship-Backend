const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all task, employee is in
      const response = Member.distinct('projectId', {
        userId: req.admin.id,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });
      
      if (response) {
        const tasks = [];
        response.map(async (project) => {
          const projectId = project._id;
          const req = await Task.findAll({
            projectId,
            companyId: req.admin.companyId,
            removed: false,
          });
          tasks.push(...req)
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
    console.error('Tasks Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
