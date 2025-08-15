const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      companyId: req.admin.companyId,
      removed: false,
    });
    if (!workspace) {
      return res.status(404).json({
        success: false,
        workspace: null,
        message: 'No Workspace found',
      });
    } else {
      return res.status(200).json({
        success: true,
        workspace,
        message: 'We found this Workspace',
      });
    }
  } catch (error) {
    console.error('Workspace Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
