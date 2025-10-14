const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const moment = require('moment');

const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const { getFullName } = require('@/utils/commonFunctions');
const { attendanceTemplate } = require('@/config/emailTemplates/attendanceTemplates');
const { generateMasterTemplate } = require('@/emailTemplate/masterTemplate');
const { sendEmail } = require('@/utils/emailSender');
const { BULK_ATTENDANCE_CREATED } = require('@/config/activity.enums');

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
    for (const user of users) userMap[user.employeeCode] = user;

    // 3. Fetch Plants
    const plants = await Plant.find({ companyId, plantCode: { $in: plantCodes } });
    const plantMap = {};
    for (const plant of plants) plantMap[plant.plantCode] = plant._id;

    const success = [];
    const failed = [];

    for (const row of attendanceData) {
      const employeeCode = row.EmployeeCode?.toString().trim();
      const dateStr = row.Date;
      const inTimeStr = row.InTime;
      const outTimeStr = row.OutTime;
      const plantCode = row.PlantCode?.toString().trim().toUpperCase();
      const status = row?.Status;

      if (!employeeCode || !dateStr || !inTimeStr || !outTimeStr || !plantCode || !status) {
        failed.push({ ...row, reason: 'Missing required fields' });
        continue;
      }

      if (!(status == "present" || status == "absent")) {
        failed.push({ ...row, reason: 'Status should be present or absent' });
        continue;
      }

      const user = userMap[employeeCode];
      const plantId = plantMap[plantCode];
      const date = moment(dateStr, 'YYYY-MM-DD');

      if (!user) { failed.push({ ...row, reason: 'User not found' }); continue; }
      if (!plantId) { failed.push({ ...row, reason: 'Invalid PlantCode' }); continue; }

      try {
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
          inTime: inTimeStr,
          outTime: outTimeStr,
          date: date.startOf('day').toDate(),
          status
        });

        await attendance.save();

        // 🟢 Activity Tracker: Bulk Attendance Created
        activityTracker({
          userId: req.admin._id,
          companyId: companyId,
          plantId: plantId,
          module: MODULE.attendance,
          subModuleAffected: null,
          fileAffected: FILE.file_mark_attendance_bulk,
          modelAffected: [MODEL_AFFECTED.model_attendance],
          eventType: BULK_ATTENDANCE_CREATED,
          actionDone: ACTIONS.create,
          oldData: null,
          newData: attendance.toObject(),
          description: `Bulk attendance created for employee ${getFullName(user.employeeInfo)} (${user.employeeCode}) on ${date.format('YYYY-MM-DD')} by ${getFullName(req.admin.employeeInfo)}`
        });

        success.push({ employeeCode, date: date.format('YYYY-MM-DD') });

        /*
        // ---- EMAIL INTEGRATION FOR INDIVIDUAL RECORD ----
        const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
        const attendanceLink = `${baseUrl}attendance/my-attendance`;
        const uploadDate = new Date().toLocaleString();

        if (user?.email) {
          const attendanceDetails = `
            Date: ${date.format('YYYY-MM-DD')}<br/>
            In Time: ${inTimeStr}<br/>
            Out Time: ${outTimeStr}<br/>
            Status: ${status}<br/>
            Processed By: ${getFullName(req.admin.employeeInfo) || req.admin.name || 'Admin'}
          `;

          const emailHtml = generateMasterTemplate({
            user_name: getFullName(user.employeeInfo),
            event_name: attendanceTemplate.bulkAttendanceCreated.event_name,
            action: attendanceTemplate.bulkAttendanceCreated.action,
            status: 'Processed',
            message_intro: `Your attendance has been processed through bulk upload`,
            notes: `${attendanceDetails}<br/>Processed On: ${uploadDate}`,
            actionbutton_text: attendanceTemplate.bulkAttendanceCreated.actionbutton_text,
            actionlink: attendanceLink,
            fallback_note: attendanceTemplate.bulkAttendanceCreated.fallback_note,
            action_link: attendanceLink
          });
          sendEmail(user.email, attendanceTemplate.bulkAttendanceCreated.subject, emailHtml);
        }
        **/

      } catch (err) {
        failed.push({ ...row, reason: err.message });
      }
    }

    fs.unlinkSync(file.path); // Clean up uploaded file

    /*
    // ---- BULK EMAIL INTEGRATION ----
    if (success.length > 0) {
      const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
      const attendanceLink = `${baseUrl}attendance/my-attendance`;
      const uploadDate = new Date().toLocaleString();

      // Group successful entries by employee
      const employeeGroups = {};
      for (const entry of success) {
        if (!employeeGroups[entry.employeeCode]) {
          employeeGroups[entry.employeeCode] = [];
        }
        employeeGroups[entry.employeeCode].push(entry.date);
      }

      // Send email to each affected employee
      for (const [employeeCode, dates] of Object.entries(employeeGroups)) {
        const user = userMap[employeeCode];
        if (user?.email) {
          const attendanceDetails = `
            Dates Processed: ${dates.join(', ')}<br/>
            Total Entries: ${dates.length}<br/>
            Processed By: ${getFullName(req.admin.employeeInfo) || req.admin.name || 'Admin'}
          `;

          const emailHtml = generateMasterTemplate({
            user_name: getFullName(user.employeeInfo),
            event_name: attendanceTemplate.bulkAttendanceCreated.event_name,
            action: attendanceTemplate.bulkAttendanceCreated.action,
            status: 'Processed',
            message_intro: `Your attendance has been processed through bulk upload`,
            notes: `${attendanceDetails}<br/>Processed On: ${uploadDate}`,
            actionbutton_text: attendanceTemplate.bulkAttendanceCreated.actionbutton_text,
            actionlink: attendanceLink,
            fallback_note: attendanceTemplate.bulkAttendanceCreated.fallback_note,
            action_link: attendanceLink
          });
          sendEmail(user.email, attendanceTemplate.bulkAttendanceCreated.subject, emailHtml);
        }
      }
    }*/

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
      error: error.message
    });
  }
};

module.exports = markAttendanceBulk;