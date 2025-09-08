const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all subtask, employee is in
      const response = Member.distinct('projectId', {
        userId: req.admin.id,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });
      
      if (response) {
        const subtasks = [];
        response.map(async (project) => {
          const projectId = project._id;
          const req = await Subtask.findAll({
            projectId,
            companyId: req.admin.companyId,
            removed: false,
          });
          subtasks.push(...req)
        });

        if (subtasks.length == 0) {
          return res.status(404).json({
            success: false,
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
        return res.status(404).json({
          success: false,
          subtasks: null,
          message: 'No Subtasks found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        Subtasks: null,
        message: 'You are not an employee',
      });
    }
  } catch (error) {
    console.error('Subtasks Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
