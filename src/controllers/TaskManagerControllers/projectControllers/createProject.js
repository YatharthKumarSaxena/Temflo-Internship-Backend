const mongoose = require('mongoose');

const createProject = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    const Workspace = mongoose.model('Workspace');

    const { name, description, emoji, links, tags } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    // 1. Fetch workspace
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // 2. Extract plantId from workspace
    const { plantId } = workspace;

    // 3. Create project
    const project = new Project({
      name,
      description,
      emoji,
      createdBy: req.admin.id,
      workspaceId: workspace._id,
      companyId: req.admin.companyId,
      plantId, // now from workspace
      links,
      tags,
    });

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
