const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Activity = mongoose.model('Activity');

    const activity = await Activity.find({projectId: req.params.projectId})

    if (!activity) {
      return res.status(404).json({
        success: false,
        activity: null,
        message: 'No Activity found',
      });
    } else {
      return res.status(200).json({
        success: true,
        activity,
        message: 'We found this Activity',
      });
    }
  } catch (error) {
    console.error('Activity Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
