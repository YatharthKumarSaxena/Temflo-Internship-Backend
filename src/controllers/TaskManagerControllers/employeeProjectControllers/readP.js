const mongoose = require('mongoose');

const readP = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      const response = Member.findOne({
        userId: req.admin.id,
        projectId: req.params.projectId,
        companyId: req.admin.companyId,
        removed: false,
      });
      if (response) {
        const project = await Project.findOne({
          _id: req.params.projectId,
          companyId: req.admin.companyId,
          removed: false,
        });

        if (!project) {
          return res.status(200).json({
            success: true,
            project: null,
            message: 'No Project found',
          });
        } else {
          return res.status(200).json({
            success: true,
            project,
            message: 'We found this Project',
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          project: null,
          message: 'No Project found',
        });
      }

    } else {
      return res.status(404).json({
        success: false,
        project: null,
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

module.exports = readP;
