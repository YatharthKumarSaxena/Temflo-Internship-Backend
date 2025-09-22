const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting');
const Attendance = require('../../models/AttendanceModels/Attendance');
const AttendanceRequest = require('../../models/AttendanceModels/AttendanceRequest');
const AttendanceEmployeeSettings = require('../../models/AttendanceModels/AttendanceEmployeeSetting');
const User = require('../../models/userModels/User');
const moment = require('moment');

const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
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
      });

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
    });

    return res.status(200).json({ message: 'Attendance marked successfully', attendance });

  } catch (error) {
    console.error('Error in marking attendance:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = EmployeeMarkAttendance;