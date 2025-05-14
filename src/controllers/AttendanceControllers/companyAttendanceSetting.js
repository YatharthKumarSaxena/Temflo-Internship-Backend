const User = require('../../models/userModels/User')
const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting')


const companyAttendanceSetting = async (req, res) => {

  try {
    // Step 1: Find user by _id
    const user = await User.findOne({ _id: req.admin.id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { companyId, plantId } = user;

    if (!companyId || !plantId) {
      return res.status(400).json({ success: false, message: 'User does not have company or plant info' });
    }

    // Step 2: Find attendance settings using companyId and plantId
    const settings = await AttendanceSettings.findOne({ companyId, plantId });

    if (!settings) {
      return res.status(404).json({ success: false, message: 'Attendance settings not found' });
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = companyAttendanceSetting;
