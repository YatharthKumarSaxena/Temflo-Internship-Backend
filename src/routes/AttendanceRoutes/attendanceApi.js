const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const attendanceApi = require('@/controllers/AttendanceControllers/index')
const upload = require('../../services/file-upload')


router.route('/setting/:plantId').post(catchErrors(attendanceApi.AttendanceSetting.setSettings));
router.route('/setting/:plantId').get(catchErrors(attendanceApi.AttendanceSetting.getSettings));
router.route('/holidays/:plantId').post(catchErrors(attendanceApi.AttendanceSetting.addHoliday))
router.route('/delete-holiday/:plantId/:holidayId').delete(catchErrors(attendanceApi.AttendanceSetting.deleteHoliday))
router.route('/weekly-off/:plantId').post(catchErrors(attendanceApi.AttendanceSetting.setWeeklyOff))
router.route('/working-hours/:plantId').post(catchErrors(attendanceApi.AttendanceSetting.setWorkingHours))
router.route('/mark/:plantId').post(catchErrors(attendanceApi.AttendanceSetting.markAttendance))
router.route('/mark-bulk').post(upload.single('excelsheet'),catchErrors(attendanceApi.markAttendanceBulk))
router.route('/dashboard/:plantId').get(catchErrors(attendanceApi.dashboard.Attendancesummary))
router.route('/attendance-requests/:plantId').get(catchErrors(attendanceApi.dashboard.getAttendanceRequests))

router.route('/attendance-employee-setting').post(catchErrors(attendanceApi.EmpAttendanceSetting))
router.route('/attendance-employee-setting/:plantId/:userId').get(attendanceApi.AttendanceSetting.getEmployeeSetting)

router.route('/company-attendance-setting').get(catchErrors(attendanceApi.companyAttendanceSetting))
router.route('/employee-mark-attendance').post(catchErrors(attendanceApi.EmployeeMarkAttendance))
router.route('/marked').get(catchErrors(attendanceApi.EmployeeAttendance))

router.route('/attendance-policy').post(catchErrors(attendanceApi.AttendanceSetting.createAttendancePolicy))
router.route('/attendance-policy/:id').patch(catchErrors(attendanceApi.AttendanceSetting.updateAttendancePolicy))
router.route('/attendance-policy/:plantId').get(catchErrors(attendanceApi.AttendanceSetting.getAttendancePolicy))

router.route('/apply-attendance-policy/:plantId/:policyId').get(catchErrors(attendanceApi.AttendanceSetting.applyAttendancePolicy))
router.route('/apply-attendance-policy/selected').post(catchErrors(attendanceApi.AttendanceSetting.applyAttendancePolicyToSelectedEmployees))

module.exports = router