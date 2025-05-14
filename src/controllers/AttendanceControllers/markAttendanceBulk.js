const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const moment = require('moment');

const markAttendanceBulk = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Plant = mongoose.model('Plant');
    const Attendance = mongoose.model('Attendance');

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'Excel file is required' });

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets['Attendance'];
    const attendanceData = xlsx.utils.sheet_to_json(sheet);

    const companyId = req.admin.companyId;

    // 1. Extract all unique EmployeeCodes & PlantCodes
    const employeeCodes = [...new Set(attendanceData.map(row => row.EmployeeCode?.toString().trim()))];
    const plantCodes = [...new Set(attendanceData.map(row => row.PlantCode?.toString().trim().toUpperCase()))];

    // 2. Fetch Users
    const users = await User.find({
      companyId,
      removed: false,
      employeeCode: { $in: employeeCodes }
    });
    const userMap = {};
    for (const user of users) {
      userMap[user.employeeCode] = user;
    }

    // 3. Fetch Plants
    const plants = await Plant.find({ companyId, plantCode: { $in: plantCodes } });
    const plantMap = {};
    for (const plant of plants) {
      plantMap[plant.plantCode] = plant._id;
    }

    // 4. Prepare attendance records
    const success = [];
    const failed = [];

    for (const row of attendanceData) {
      const employeeCode = row.EmployeeCode?.toString().trim();
      const dateStr = row.Date;
      const inTimeStr = row.InTime;
      const outTimeStr = row.OutTime;
      const plantCode = row.PlantCode?.toString().trim().toUpperCase();

      if (!employeeCode || !dateStr || !inTimeStr || !outTimeStr || !plantCode) {
        failed.push({ ...row, reason: 'Missing required fields' });
        continue;
      }

      const user = userMap[employeeCode];
      const plantId = plantMap[plantCode];
      const date = moment(dateStr, 'YYYY-MM-DD');
      const inTime = inTimeStr;
      const outTime = outTimeStr;

      console.log(inTime, outTime)

      if (!user) {
        failed.push({ ...row, reason: 'User not found' });
        continue;
      }

      if (!plantId) {
        failed.push({ ...row, reason: 'Invalid PlantCode' });
        continue;
      }

      try {
        // Check if attendance already exists
        const existing = await Attendance.findOne({
          userId: user._id,
          date: date.startOf('day').toDate(),
          companyId
        });

        if (existing) {
          failed.push({ ...row, reason: 'Attendance already marked for this date' });
          continue;
        }

        const attendance = new Attendance({
          userId: user._id,
          companyId,
          plantId,
          inTime: inTime,
          outTime: outTime,
          date: date.startOf('day').toDate()
        });

        await attendance.save();
        success.push({ employeeCode, date: date.format('YYYY-MM-DD') });

      } catch (err) {
        failed.push({ ...row, reason: err.message });
      }
    }

    fs.unlinkSync(file.path); // Clean up uploaded file

    return res.status(200).json({
      success: true,
      message: 'Bulk attendance upload complete',
      logs: { created: success, failed }
    });

  } catch (error) {
    console.error('Bulk Attendance Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = markAttendanceBulk;
