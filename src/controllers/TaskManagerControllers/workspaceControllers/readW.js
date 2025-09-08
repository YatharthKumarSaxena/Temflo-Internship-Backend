const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      companyId: req.admin.companyId,
        });
    if (!workspace) {
      return res.status(404).json({
        success: false,
        workspace: null,
        message: 'No Workspace found',
      });
    } else {
      if(workspace?.removed){
        return res.status(400).json({
          success: false,
          message: 'Workspace is Not Active',
        });

      }else{
      return res.status(200).json({
        success: true,
        workspace,
        message: 'We found this Workspace',
      });
    }
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
