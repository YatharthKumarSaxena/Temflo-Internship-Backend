const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');
    const Member = mongoose.model('Member');

    // check if user is employee
    if (req.admin.role === 'employee') {
      // find all workspace, employee is in
      const workspaceIds = Member.distinct('workspaceId', {
        userId: req.admin.id,
        companyId: req.admin.companyId,
        removed: false, // Only active memberships
      });
      if (workspaceIds) {
        const workspaces = [];
        workspaceIds.map(async (workspace) => {
          const workspaceId = workspace.workspaceId;
          const req = await Workspace.findOne({
            _id: workspaceId,
            companyId: req.admin.companyId,
            removed: false,
          });
          workspaces.push(req);
        });

        if (workspaces.length == 0) {
          return res.status(404).json({
            success: false,
            workspaces: null,
            message: 'No Workspaces found',
          });
        } else {
          return res.status(200).json({
            success: true,
            workspaces,
            message: 'We found this Workspaces',
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          workspaces: null,
          message: 'No Workspaces found',
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

module.exports = read;
