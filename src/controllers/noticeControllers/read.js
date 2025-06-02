const mongoose = require('mongoose');

const readAllNotices = async (req, res) => {
  try {
    const Notice = mongoose.model('Notice');

    const notices = await Notice.find({
      companyId: req.admin.companyId
    }).exec();

    if (!notices || notices.length === 0) {
      return res.status(200).json({
        success: true,
        result: [],
        message: 'No Notices found for your company.',
      });
    }

    return res.status(200).json({
      success: true,
      result: notices,
      message: 'Notices fetched successfully.',
    });

  } catch (error) {
    console.error('Error fetching notices:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Internal server error',
    });
  }
};

module.exports = readAllNotices;
