const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Member = mongoose.model('Member');

    // Check if user is an employee
    if (req.admin.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can fetch assigned tasks.',
      });
    }

    // 1. Get projectIds where this employee is a member
    const projectIds = await Member.distinct('projectId', {
      userId: req.admin.id,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!projectIds || projectIds.length === 0) {
      return res.status(404).json({
        success: false,
        tasks: [],
        message: 'No project memberships found for the employee.',
      });
    }

    // 2. Find all tasks under these project IDs
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      companyId: req.admin.companyId,
      removed: false,
    });

    return res.status(200).json({
      success: true,
      tasks,
      message: tasks.length ? 'Tasks found successfully.' : 'No tasks available for this employee.',
    });
  } catch (error) {
    console.error('Tasks Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
