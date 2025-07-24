const AttendanceSetting = require('./AttendanceSetting')
const dashboard = require('./dashboard')
const markAttendanceBulk = require('./markAttendanceBulk')
const companyAttendanceSetting = require('./companyAttendanceSetting')
const EmployeeMarkAttendance = require('./EmployeeMarkAttendance')
const EmployeeAttendance = require('./EmployeeAttendance')
const EmpAttendanceSetting = require('./EmployeeAttendanceSetting')

const AttendanceMethods = {
    AttendanceSetting,
    dashboard,
    markAttendanceBulk,
    companyAttendanceSetting,
    EmployeeMarkAttendance,
    EmployeeAttendance,
    EmpAttendanceSetting
};

module.exports = AttendanceMethods;
