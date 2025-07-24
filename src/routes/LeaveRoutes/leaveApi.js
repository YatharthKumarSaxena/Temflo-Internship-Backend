const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const leaveApi = require('@/controllers/LeaveControllers/index')
const upload = require('../../services/file-upload')

// Leave Policy
router.route('/leave-policy').post(catchErrors(leaveApi.adminLeaveController.createLeavePolicy))
router.route('/leave-policy/:id').patch(catchErrors(leaveApi.adminLeaveController.updateLeavePolicy))
router.route('/leave-policy/:id').delete(catchErrors(leaveApi.adminLeaveController.deleteLeavePolicy))
router.route('/leave-policy/:plantId').get(catchErrors(leaveApi.adminLeaveController.getCompanyLeavePolicies))
router.route('/create-leave-balance/selected').post(catchErrors(leaveApi.adminLeaveController.applyLeavePolicyToSelectedEmployees))
router.route('/leave-balance/:employeeId').get(catchErrors(leaveApi.employeeLeaveController.getLeaveBalancesByEmployeeId))
router.route('/policy/employee-list/:policyId').get(catchErrors(leaveApi.adminLeaveController.getPolicyEmployees))
router.route('/policy/:policyId/status').patch(catchErrors(leaveApi.adminLeaveController.activatePolicy))



// Leave Balance & Requests
router.route('/leave-balance').get(catchErrors(leaveApi.adminLeaveController.getCompanyLeaveBalances))
router.route('/leave-requests-summary/:plantId').get(catchErrors(leaveApi.adminLeaveController.getLeaveRequests))
router.route('/leave-requests/:employeeId').get(catchErrors(leaveApi.adminLeaveController.getLeaveRequestsByEmployee))

router.route('/leave-request/:id/status').patch(catchErrors(leaveApi.adminLeaveController.updateLeaveRequestStatus))
router.route('/create-leave-balance/:plantId/:policyId').get(catchErrors(leaveApi.adminLeaveController.createLeaveBalance))
router.route('/reset-leave-balance/:plantId/:policyId').get(catchErrors(leaveApi.adminLeaveController.resetLeaveBalance))
router.route('/mark-leave-admin').post(catchErrors(leaveApi.adminLeaveController.markLeave))

// Employee Routes
router.route('/leave-balance-me').get(catchErrors(leaveApi.employeeLeaveController.getMyLeaveBalances))
router.route('/apply-leave').post(catchErrors(leaveApi.employeeLeaveController.applyForLeave))
router.route('/my-requests').get(catchErrors(leaveApi.employeeLeaveController.getMyLeaveRequests))
router.route('/cancel/:requestId').delete(catchErrors(leaveApi.employeeLeaveController.cancelLeaveRequest))
router.route('/supervisor-leave-requests-summary').get(catchErrors(leaveApi.employeeLeaveController.getLeaveRequests))
router.route('/supervisor-leave-request/:id/status').patch(catchErrors(leaveApi.employeeLeaveController.updateLeaveRequestStatus))


router.route('/employee-on-leave').get(catchErrors(leaveApi.adminLeaveController.getEmployeeOnLeave))


module.exports = router