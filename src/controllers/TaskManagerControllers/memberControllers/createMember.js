const mongoose = require('mongoose');

const createMember = async (req, res) => {
  try {
    const Member = mongoose.model('Member');

    const { userId, workspaceId, projectId, taskId, plantId } = req.body;

    if (!userId || !workspaceId || !projectId || !plantId) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const prevMember = await Member.findOne({ projectId, userId });

    if (prevMember) {
      // check if removed , if yes do removed false
      if (prevMember.removed == true) {
        prevMember.removed = false;
        await prevMember.save();
        return res.status(200).json({
          success: true,
          message: 'Previous Member Found, Readded Successfully',
        });
      }
      // check if already added return
      return res.status(200).json({
      success: true,
      message: 'Previous Member Found, Cannot Readd',
    });
    }

    const member = new Member({
      userId,
      workspaceId,
      projectId,
      companyId: req.admin.companyId,
      plantId,
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
