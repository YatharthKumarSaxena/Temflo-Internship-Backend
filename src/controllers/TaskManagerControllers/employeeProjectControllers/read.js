const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all project, employee is in
      const projectIds = Member.distinct('projectId', {
        userId: req.admin.id,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });
      
      if (projectIds) {
        const projects = [];
        projectIds.map(async (project) => {
          const projectId = project.projectId;
          const req = await Project.findOne({
            _id: projectId,
            companyId: req.admin.companyId,
            removed: false,
          });
          projects.push(req);
        });

        if (projects.length == 0) {
          return res.status(404).json({
            success: false,
            projects: null,
            message: 'No Projects found',
          });
        } else {
          return res.status(200).json({
            success: true,
            projects,
            message: 'We found this Projects',
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          projects: null,
          message: 'No Projects found',
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        projects: null,
        message: 'You are not an employee',
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
