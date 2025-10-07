const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting');
const Attendance = require('../../models/AttendanceModels/Attendance');
const AttendanceRequest = require('../../models/AttendanceModels/AttendanceRequest');
const AttendanceEmployeeSettings = require('../../models/AttendanceModels/AttendanceEmployeeSetting');
const User = require('../../models/userModels/User');
const moment = require('moment');

const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const { getFullName } = require('@/utils/commonFunctions');
const { attendanceTemplate } = require('@/config/emailTemplates/attendanceTemplates');
const { generateMasterTemplate } = require('@/emailTemplate/masterTemplate');
const { sendEmail } = require('@/utils/emailSender');
const { ATTENDANCE_MARKED_BY_EMP, EMP_ATTENDANCE_UPDATED, EMP_ATTENDANCE_MARKED } = require('@/config/activity.enums');

const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(coords1.latitude);
  const φ2 = toRad(coords2.latitude);
  const Δφ = toRad(coords2.latitude - coords1.latitude);
  const Δλ = toRad(coords2.longitude - coords1.longitude);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmployeeMarkAttendance = async (req, res) => {
  try {
    const { date, inTime, outTime, location, empStatus, reason } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const attendanceDate = moment(date).startOf('day');
    const today = moment().startOf('day');

    if (attendanceDate.isAfter(today)) {
      return res.status(400).json({ message: "You cannot mark attendance after today's date" });
    }

    const employee = await User.findById(req.admin._id);
    if (!employee || !employee.plantId) {
      return res.status(404).json({ message: 'Employee or Plant not found' });
    }

    const settings = await AttendanceEmployeeSettings.findOne({
      userId: req.admin._id,
      plantId: employee.plantId,
      companyId: req.admin.companyId
    });

    if (!settings || !settings.isMarkingEnabled) {
      return res.status(403).json({ message: 'Attendance marking is disabled by the company' });
    }

    // ✅ CASE 1: Mark attendance request (for past date)
    if (empStatus === "Pending") {
      let approver = employee.supervisor;

      if (!approver) {
        const admin = await User.findOne({ plantId: employee.plantId, role: 'Admin' });
        if (admin) approver = admin._id;
      }

      const existingRequest = await Attendance.findOne({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: employee.plantId,
        date: attendanceDate.startOf('day').toDate()
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: `Attendance already requested. Current status: ${existingRequest.status}`,
        });
      }

      const request = new Attendance({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: employee.plantId,
        date: attendanceDate.toDate(),
        reason: reason || 'Marked attendance for past date',
        approver: approver || null,
        status: 'pending'
      });

      await request.save();

      // 🟨 Activity Tracker: Attendance Request Created
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: employee.plantId,
        module: MODULE.attendance,
        subModuleAffected: null,
        fileAffected: FILE.file_employee_mark_attendance,
        modelAffected: [MODEL_AFFECTED.model_attendance],
        eventType: ATTENDANCE_MARKED_BY_EMP,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: request.toObject(),
        description: `Attendance request created by employee ${getFullName(req.admin.employeeInfo)} (${req.admin.employeeCode || employee.employeeCode}) for date ${attendanceDate.format('YYYY-MM-DD')}`
      });

      // ---- EMAIL INTEGRATION ----
      const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
      const requestLink = `${baseUrl}attendance/requests`;

      const requestDetails = `
        Date: ${attendanceDate.format('YYYY-MM-DD')}<br/>
        Reason: ${reason || 'Marked attendance for past date'}<br/>
        Employee: ${getFullName(req.admin.employeeInfo)} (${req.admin.employeeCode || employee.employeeCode})
      `;
      const requestDate = new Date().toLocaleString();

      // Email to Employee (confirmation)
      if (employee?.email) {
        const emailHtmlToEmployee = generateMasterTemplate({
          user_name: getFullName(employee.employeeInfo),
          event_name: attendanceTemplate.attendanceRequestCreated.event_name,
          action: attendanceTemplate.attendanceRequestCreated.action,
          status: 'Submitted',
          message_intro: `Your attendance request has been submitted and is pending approval`,
          notes: `${requestDetails}<br/>Submitted On: ${requestDate}`,
          actionbutton_text: attendanceTemplate.attendanceRequestCreated.actionbutton_text,
          actionlink: requestLink,
          fallback_note: attendanceTemplate.attendanceRequestCreated.fallback_note,
          action_link: requestLink
        });
        sendEmail(employee.email, attendanceTemplate.attendanceRequestCreated.subject, emailHtmlToEmployee);
      }

      // Email to Supervisor (if exists)
      if (approver) {
        const supervisor = await User.findById(approver);
        if (supervisor?.email) {
          const emailHtmlToSupervisor = generateMasterTemplate({
            user_name: getFullName(supervisor.employeeInfo),
            event_name: attendanceTemplate.attendanceRequestCreated.event_name,
            action: attendanceTemplate.attendanceRequestCreated.action,
            status: 'Pending Approval',
            message_intro: `An attendance request has been submitted by Employee whose Employee Code: ${(req.admin.employeeCode)} and requires your approval`,
            notes: `${requestDetails}<br/>Submitted On: ${requestDate}`,
            actionbutton_text: 'Review Request',
            actionlink: requestLink,
            fallback_note: attendanceTemplate.attendanceRequestCreated.fallback_note,
            action_link: requestLink
          });
          sendEmail(supervisor.email, attendanceTemplate.attendanceRequestCreated.subject, emailHtmlToSupervisor);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Attendance request submitted for approval',
        request,
      });
    }

    // ✅ CASE 2: Normal attendance marking (today)
    if (settings.isLocationBased) {
      if (!location || !location.latitude || !location.longitude) {
        return res.status(400).json({ message: 'Location is required' });
      }

      const officeLocation = settings.location;
      const radiusInMeters = officeLocation.radius || 300;

      const distance = haversineDistance(location, officeLocation);
      if (distance > radiusInMeters) {
        return res.status(400).json({ message: 'You are outside the allowed location radius' });
      }
    }

    let attendance = await Attendance.findOne({
      userId: req.admin._id,
      date: attendanceDate.toDate()
    });

    const oldData = attendance ? attendance.toObject() : null;

    if (!attendance) {
      attendance = new Attendance({
        userId: req.admin._id,
        date: attendanceDate.toDate(),
        plantId: employee.plantId,
        companyId: req.admin.companyId,
        inTime: null,
        outTime: null,
        approver: null,
      });
    }

    if (inTime) {
      if (attendance.inTime) {
        return res.status(400).json({ message: 'In Time already marked' });
      }
      attendance.inTime = inTime;
    }

    if (outTime) {
      if (!attendance.inTime) {
        return res.status(400).json({ message: 'You must mark In Time first' });
      }
      if (attendance.outTime) {
        return res.status(400).json({ message: 'Out Time already marked' });
      }
      attendance.outTime = outTime;
    }

    if (settings.isApprovalRequired) {
      let approver = employee.supervisor;
      if (!approver) {
        const admin = await User.findOne({ plantId: employee.plantId, role: 'Admin' });
        if (admin) approver = admin._id;
      }
      attendance.approver = approver;
      attendance.status = 'pending';
    }

    await attendance.save();

    // 🟩 Activity Tracker: Attendance marked or updated
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: employee.plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_mark_attendance,
      modelAffected: [MODEL_AFFECTED.model_attendance],
      eventType: oldData ? EMP_ATTENDANCE_UPDATED : EMP_ATTENDANCE_MARKED,
      actionDone: oldData ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: attendance.toObject(),
      description: `Attendance ${oldData ? 'updated' : 'marked'} by employee ${getFullName(req.admin.employeeInfo)} (${req.admin.employeeCode || employee.employeeCode}) for date ${attendanceDate.format('YYYY-MM-DD')}${inTime ? ` - In: ${inTime}` : ''}${outTime ? ` - Out: ${outTime}` : ''}`
    });

    // ---- EMAIL INTEGRATION ----
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const attendanceLink = `${baseUrl}attendance/my-attendance`;

    const attendanceDetails = `
      Date: ${attendanceDate.format('YYYY-MM-DD')}<br/>
      ${inTime ? `In Time: ${inTime}<br/>` : ''}
      ${outTime ? `Out Time: ${outTime}<br/>` : ''}
      Status: ${settings.isApprovalRequired ? 'Pending Approval' : 'Marked'}
    `;
    const markDate = new Date().toLocaleString();

    // Email to Employee (confirmation)
    if (employee?.email) {
      const templateToUse = oldData ? attendanceTemplate.attendanceUpdatedByEmployee : attendanceTemplate.attendanceMarkedByEmployee;
      const emailHtmlToEmployee = generateMasterTemplate({
        user_name: getFullName(employee.employeeInfo),
        event_name: templateToUse.event_name,
        action: templateToUse.action,
        status: settings.isApprovalRequired ? 'Pending Approval' : 'Confirmed',
        message_intro: `Your attendance has been ${oldData ? 'updated' : 'marked'} successfully${settings.isApprovalRequired ? ' and is pending approval' : ''}`,
        notes: `${attendanceDetails}<br/>${oldData ? 'Updated' : 'Marked'} On: ${markDate}`,
        actionbutton_text: templateToUse.actionbutton_text,
        actionlink: attendanceLink,
        fallback_note: templateToUse.fallback_note,
        action_link: attendanceLink
      });
      sendEmail(employee.email, templateToUse.subject, emailHtmlToEmployee);
    }

    // Email to Supervisor (if approval required and supervisor exists)
    if (settings.isApprovalRequired && attendance.approver) {
      const supervisor = await User.findById(attendance.approver);
      if (supervisor?.email) {
        const emailHtmlToSupervisor = generateMasterTemplate({
          user_name: getFullName(supervisor.employeeInfo),
          event_name: oldData ? attendanceTemplate.attendanceUpdatedByEmployee.event_name : attendanceTemplate.attendanceMarkedByEmployee.event_name,
          action: oldData ? attendanceTemplate.attendanceUpdatedByEmployee.action : attendanceTemplate.attendanceMarkedByEmployee.action,
          status: 'Pending Your Approval',
          message_intro: `${getFullName(req.admin.employeeInfo)} whose Employee Code: ${req.admin.employeeCode} has ${oldData ? 'updated' : 'marked'} attendance and requires your approval`,
          notes: `${attendanceDetails}<br/>${oldData ? 'Updated' : 'Marked'} On: ${markDate}`,
          actionbutton_text: 'Review Attendance',
          actionlink: `${baseUrl}attendance/requests`,
          fallback_note: 'Please review and approve the attendance request',
          action_link: `${baseUrl}attendance/requests`
        });
        sendEmail(supervisor.email, 'Attendance Approval Required', emailHtmlToSupervisor);
      }
    }

    return res.status(200).json({ message: 'Attendance marked successfully', attendance });

  } catch (error) {
    console.error('Error in marking attendance:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = EmployeeMarkAttendance;