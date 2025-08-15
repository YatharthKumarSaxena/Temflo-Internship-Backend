const mongoose = require('mongoose');

const remove = async (req, res) => {
  // userId
  try {
    const Member = mongoose.model('Member');
    const Activity = mongoose.model('Activity');

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(404).json({
        success: false,
        message: 'Task Id required To Delete',
      });
    }

    const member = await Member.findOne({ userId: req.params.userId, taskId, removed: false });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No Member Found To Remove',
      });
    }
    member.removed = true;
    await member.save();

    // Activity
    const activity = new Activity({
      companyId: req.admin.companyId,
      plantId: member.plantId,
      workspaceId: member.workspaceId,
      projectId: member.projectId,
      taskId: member.taskId,
      activityBy: req.admin.id,
      message: 'MEMBER REMOVED',
    });
    await activity.save();

    return res.status(200).json({
      success: true,
      message: 'Member removed',
    });
  } catch (error) {
    console.error('Member Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
