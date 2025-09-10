const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const assignmentController = require('../../controllers/appControllers/assignmentController');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Department assignment routes
router
  .route('/department/assign')
  .post(AdminOwner, catchErrors(assignmentController.assignDepartment));

router
  .route('/department/list/:plantId?')
  .get(catchErrors(assignmentController.getDepartmentAssignments));

router
  .route('/department/update/:assignmentId')
  .patch(AdminOwner, catchErrors(assignmentController.updateDepartmentAssignment));

router
  .route('/department/delete/:assignmentId')
  .delete(AdminOwner, catchErrors(assignmentController.deleteDepartmentAssignment));

// Get all assignments (admin view)
router.route('/department/all').get(catchErrors(assignmentController.getAllAssignments));

module.exports = router;
