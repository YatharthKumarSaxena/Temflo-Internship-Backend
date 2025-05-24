const adminLeaveController = require('./adminLeaveController')
const employeeLeaveController = require('./employeeLeaveController')

const LeaveMethods = {
    adminLeaveController,
    employeeLeaveController
};

module.exports = LeaveMethods;
