const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');
    const Member = mongoose.model('Member');

    // Only allow employees
    if (req.admin.role !== 'employee') {
      return res.status(403).json({
        success: false,
        workspaces: null,
        message: 'Only employees can fetch assigned workspaces',
      });
    }

    // 1. Get all workspaceIds for this employee
    const workspaceIds = await Member.distinct('workspaceId', {
      userId: req.admin.id,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!workspaceIds || workspaceIds.length === 0) {
      return res.status(404).json({
        success: false,
        workspaces: [],
        message: 'No Workspaces found',
      });
    }

    // 2. Fetch all workspaces with those IDs
    const workspaces = await Workspace.find({
      _id: { $in: workspaceIds },
      companyId: req.admin.companyId,
      removed: false,
    });

    return res.status(200).json({
      success: true,
      workspaces,
      message: workspaces.length
        ? 'Workspaces found successfully'
        : 'No valid workspaces found',
    });
  } catch (error) {
    console.error('Workspace Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
