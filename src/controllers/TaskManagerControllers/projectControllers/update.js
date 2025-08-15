const mongoose = require('mongoose');

const update = async (req, res) => {
  // params projectId
  try {
    const Project = mongoose.model('Project');

    const { name, description, emoji, links, tags } = req.body;

    const project = await Project.findOne({ _id: req.params.projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No Project Found To Update',
      });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (emoji) project.emoji = emoji;
    if (links) project.links = links;
    if (tags) project.tags = tags;

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project Updated Successfully',
    });
  } catch (error) {
    console.error('Project Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;
