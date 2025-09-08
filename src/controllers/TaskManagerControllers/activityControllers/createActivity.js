const mongoose = require('mongoose');

const createActivity = async (req, res) => {
  try {
    const Activity = mongoose.model('Activity');

    const { plantId, projectId, types, text } = req.body;

    if (!plantId || !projectId || !types) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const activity = new Activity({
      companyId: req.admin.companyId,
      plantId,
      projectId,
      activityBy: req.admin.id,
      types,
      text,
    });
    console.log('activity', activity);
    activity.save();

    return res.status(200).json({
      success: true,
      message: 'Activity Added Successfully',
    });
  } catch (error) {
    console.error('Activity Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createActivity;
