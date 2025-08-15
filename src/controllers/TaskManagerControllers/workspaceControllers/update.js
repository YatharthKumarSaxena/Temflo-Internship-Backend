const mongoose = require('mongoose');

const update = async (req, res) => {
  // params worspaceId
  try {
    const Workspace = mongoose.model('Workspace');

    const { name, description } = req.body;

    const workspace = await Workspace.findOne({ _id: req.params.workspaceId });

    if (!workspace) {
        return res.status(404).json({
        success: false,
        message: 'No Workspace Found To Update',
      });
    }

    if (name) workspace.name = name;
    if (description) workspace.description = description;

    await workspace.save()

    return res.status(200).json({
      success: true,
      message: 'Workspace Updated Successfully',
    });
  } catch (error) {
    console.error('Workspace Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;
