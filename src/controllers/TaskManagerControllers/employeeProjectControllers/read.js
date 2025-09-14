const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Member = mongoose.model('Member');

    if (req.admin.role === 'employee') {
      // Get projectIds where the employee is a member
      const projectIds = await Member.distinct('projectId', {
        userId: req.admin.id,
        companyId: req.admin.companyId,
        removed: false,
      });

      if (!projectIds || projectIds.length === 0) {
        return res.status(404).json({
          success: false,
          projects: null,
          message: 'No projects found for the employee.',
        });
      }

      // Fetch all projects by their IDs
      const projects = await Project.find({
        _id: { $in: projectIds },
        companyId: req.admin.companyId,
        removed: false,
      });

      return res.status(200).json({
        success: true,
        projects,
        message: 'Projects found successfully.',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only employees can fetch assigned projects.',
      });
    }
  } catch (error) {
    console.error('Project Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
