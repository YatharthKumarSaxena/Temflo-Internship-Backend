const mongoose = require('mongoose');

const createProject = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    // const workspace = await Workspace.findOne({ _id: req.params.workspaceId }).populate('project');
    // console.log('workspace', workspace);

    const { name, description, emoji, plantId, links, tags } = req.body;

    if ((!name, !plantId)) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const project = new Project({
      name,
      description,
      emoji,
      createdBy: req.admin.id,
      workspaceId: req.params.workspaceId,
      companyId: req.admin.companyId,
      plantId,
      links,
      tags,
    });
    console.log('project', project);
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project Created Successfully',
    });
  } catch (error) {
    console.error('Project Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createProject;
