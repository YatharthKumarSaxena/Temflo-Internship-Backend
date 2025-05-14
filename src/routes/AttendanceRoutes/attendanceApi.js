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
router.route('/dashboard/:plantId').get(catchErrors(attendanceApi.dashboard))

router.route('/company-attendance-setting').get(catchErrors(attendanceApi.companyAttendanceSetting))
router.route('/employee-mark-attendance').post(catchErrors(attendanceApi.EmployeeMarkAttendance))
router.route('/marked').get(catchErrors(attendanceApi.EmployeeAttendance))
module.exports = router