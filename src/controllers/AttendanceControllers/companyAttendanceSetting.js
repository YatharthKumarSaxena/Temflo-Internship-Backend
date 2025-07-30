const User = require('../../models/userModels/User')
const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting')
const EmployeeAttendanceSetting = require('../../models/AttendanceModels/AttendanceEmployeeSetting')

const companyAttendanceSetting = async (req, res) => {

  try {
    // Step 1: Find user by _id
    const userId = req.params.id
    const user = await User.findOne({ _id: userId, companyId:req.admin.companyId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { companyId, plantId } = user;

    if (!companyId || !plantId) {
      return res.status(400).json({ success: false, message: 'User does not have company or plant info' });
    }

    // Step 2: Find attendance settings using companyId and plantId
    const settings = await EmployeeAttendanceSetting.findOne({ userId,companyId, plantId });

    if (!settings) {
      return res.status(404).json({ success: false, message: 'First Set Employee Attendance settings ' });
    }

    const holidaySettings = await AttendanceSettings.findOne({ companyId, plantId }, 'holidays'); // Only fetching holidays field

    // Attach holidays to the settings response
    const settingsWithHolidays = {
      ...settings.toObject(),
      holidays: holidaySettings?.holidays || [],
    };
    
    res.status(200).json({ success: true, settings:settingsWithHolidays });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = companyAttendanceSetting;
