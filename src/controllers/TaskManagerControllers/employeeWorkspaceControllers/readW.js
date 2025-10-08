const mongoose = require('mongoose');

const readW = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      const response = Member.findOne({
        userId: req.admin.id,
        workspaceId: req.params.workspaceId,
        companyId: req.admin.companyId,
        removed: false,
      });
      if (response) {
        const workspace = await Workspace.findOne({
          _id: req.params.workspaceId,
          companyId: req.admin.companyId,
          removed: false,
        });

        if (!workspace) {
          return res.status(200).json({
            success: true,
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
      } else {
        return res.status(200).json({
          success: true,
          workspaces: null,
          message: 'No Workspace found',
        });
      }

    } else {
      return res.status(404).json({
        success: false,
        workspaces: null,
        message: 'You are not an employee',
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

module.exports = readW;
