const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const leaveApi = require('@/controllers/LeaveControllers/index')
const upload = require('../../services/file-upload')
const checkPermission = require('@/middlewares/access/checkMiddleware')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')

// Leave Policy
router.route('/leave-policy').post(checkPermission('manage_leave'), requireWriteAccess,
    catchErrors(leaveApi.adminLeaveController.createLeavePolicy))
router.route('/leave-policy/:id').patch(catchErrors(checkPermission('manage_leave'), requireWriteAccess,
    leaveApi.adminLeaveController.updateLeavePolicy))
router.route('/leave-policy/:id').delete(catchErrors(checkPermission('manage_leave'), requireWriteAccess,
    leaveApi.adminLeaveController.deleteLeavePolicy))
router.route('/leave-policy/:plantId').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.adminLeaveController.getCompanyLeavePolicies))
router.route('/create-leave-balance/selected').post(checkPermission('manage_leave'), requireWriteAccess, catchErrors(checkPermission('manage_leave'), requireWriteAccess,
    leaveApi.adminLeaveController.applyLeavePolicyToSelectedEmployees))
router.route('/leave-balance/:employeeId').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.employeeLeaveController.getLeaveBalancesByEmployeeId))
router.route('/policy/employee-list/:policyId').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.adminLeaveController.getPolicyEmployees))
router.route('/policy/:policyId/status').patch(checkPermission('manage_leave'), requireWriteAccess,
    catchErrors(leaveApi.adminLeaveController.activatePolicy))



// Leave Balance & Requests
router.route('/leave-balance').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.adminLeaveController.getCompanyLeaveBalances))
router.route('/leave-requests-summary/:plantId').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.adminLeaveController.getLeaveRequests))
router.route('/leave-requests/:employeeId').get(checkPermission('manage_leave'), requireReadAccess, catchErrors(leaveApi.adminLeaveController.getLeaveRequestsByEmployee))

router.route('/leave-request/:id/status').patch(catchErrors(checkPermission('manage_leave'), requireWriteAccess,
    leaveApi.adminLeaveController.updateLeaveRequestStatus))
router.route('/create-leave-balance/:plantId/:policyId').get(checkPermission('manage_leave'), requireWriteAccess, catchErrors(leaveApi.adminLeaveController.createLeaveBalance))
router.route('/reset-leave-balance/:plantId/:policyId').get(checkPermission('manage_leave'), requireWriteAccess, catchErrors(leaveApi.adminLeaveController.resetLeaveBalance))
router.route('/mark-leave-admin').post(catchErrors(checkPermission('manage_leave'), requireWriteAccess,
    leaveApi.adminLeaveController.markLeave))

// Employee Routes
router.route('/leave-balance-me').get(catchErrors(leaveApi.employeeLeaveController.getMyLeaveBalances))
router.route('/apply-leave').post(catchErrors(leaveApi.employeeLeaveController.applyForLeave))
router.route('/my-requests').get(catchErrors(leaveApi.employeeLeaveController.getMyLeaveRequests))
router.route('/cancel/:requestId').delete(catchErrors(leaveApi.employeeLeaveController.cancelLeaveRequest))
router.route('/supervisor-leave-requests-summary').get(catchErrors(leaveApi.employeeLeaveController.getLeaveRequests))
router.route('/supervisor-leave-request/:id/status').patch(catchErrors(leaveApi.employeeLeaveController.updateLeaveRequestStatus))


router.route('/employee-on-leave').get(catchErrors(leaveApi.adminLeaveController.getEmployeeOnLeave))


module.exports = router