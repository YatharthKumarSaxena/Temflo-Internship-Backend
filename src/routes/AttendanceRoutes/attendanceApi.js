const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const attendanceApi = require('@/controllers/AttendanceControllers/index')
const upload = require('../../services/file-upload')
const checkPermission = require('@/middlewares/access/checkMiddleware')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')



router.route('/setting/:plantId').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.setSettings));
router.route('/setting/:plantId').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.AttendanceSetting.getSettings));
router.route('/holidays/:plantId').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.addHoliday))
router.route('/delete-holiday/:plantId/:holidayId').delete(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.deleteHoliday))
router.route('/weekly-off/:plantId').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.setWeeklyOff))
router.route('/working-hours/:plantId').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.setWorkingHours))
router.route('/mark/:plantId').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.markAttendance))
router.route('/mark-bulk').post(checkPermission('manage_attendance'), requireWriteAccess, upload.single('excelsheet'), catchErrors(attendanceApi.markAttendanceBulk))
router.route('/dashboard/:plantId').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.dashboard.Attendancesummary))
router.route('/attendance-requests/:plantId').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.dashboard.getAttendanceRequests))

router.route('/attendance-employee-setting').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.EmpAttendanceSetting))
router.route('/attendance-employee-setting/:plantId/:userId').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.AttendanceSetting.getEmployeeSetting))


router.route('/employee-attendance-setting/:id').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.companyAttendanceSetting))

router.route('/attendance-policy').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.createAttendancePolicy))
router.route('/attendance-policy/:id').patch(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.updateAttendancePolicy))
router.route('/attendance-policy/:plantId').get(checkPermission('manage_attendance'), requireReadAccess, catchErrors(attendanceApi.AttendanceSetting.getAttendancePolicy))

router.route('/apply-attendance-policy/:plantId/:policyId').get(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.applyAttendancePolicy))
router.route('/apply-attendance-policy/selected').post(checkPermission('manage_attendance'), requireWriteAccess, catchErrors(attendanceApi.AttendanceSetting.applyAttendancePolicyToSelectedEmployees))

router.route('/supervisor-attendance-requests-summary').get(catchErrors(attendanceApi.AttendanceSetting.getAttendanceRequests))
router.route('/supervisor-attendance-request/:id/status').patch(catchErrors(attendanceApi.AttendanceSetting.updateAttendanceRequestStatus))

router.route('/employee-attendance-setting').get(catchErrors(attendanceApi.AttendanceSetting.EmployeeAttendanceSetting))
router.route('/employee-mark-attendance').post(catchErrors(attendanceApi.EmployeeMarkAttendance))
router.route('/marked').get(catchErrors(attendanceApi.EmployeeAttendance))
router.route('/my-attendance').get(catchErrors(attendanceApi.AttendanceSetting.EmployeeAttendance))


module.exports = router