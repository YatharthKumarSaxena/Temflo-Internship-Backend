const mongoose = require('mongoose');

const createMember = async (req, res) => {
  try {
    const Member = mongoose.model('Member');
    const Workspace = mongoose.model('Workspace');

    const { userId, workspaceId, projectId} = req.body;

    if (!userId || !workspaceId || !projectId) {
      return res.status(400).json({ success: false, message: 'All required fields missing' });
    }

    // 1. Fetch workspace to get plantId
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const plantId = workspace.plantId;

    // 2. Check if member already exists
    const prevMember = await Member.findOne({ projectId, userId });

    if (prevMember) {
      // If previously removed, re-add
      if (prevMember.removed === true) {
        prevMember.removed = false;
        await prevMember.save();
        return res.status(200).json({
          success: true,
          message: 'Previous Member Found, Readded Successfully',
        });
      }
      // Already added
      return res.status(200).json({
        success: true,
        message: 'Previous Member Found, Cannot Readd',
      });
    }

    // 3. Create new member
    const member = new Member({
      userId,
      workspaceId,
      projectId,
      companyId: req.admin.companyId,
      plantId, // now taken from workspace
    });

    await member.save();

    return res.status(200).json({
      success: true,
      message: 'Member Added Successfully',
    });

  } catch (error) {
    console.error('Member Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createMember;
