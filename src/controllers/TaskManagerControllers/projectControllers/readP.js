const mongoose = require('mongoose');

const readP = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findOne({
      _id: req.params.projectId,
      companyId: req.admin.companyId,
      removed: false,
    })
      .populate('createdBy')
      .populate('workspaceId');

    if (!project) {
      return res.status(404).json({
        success: false,
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
  } catch (error) {
    console.error('Project Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = readP;
