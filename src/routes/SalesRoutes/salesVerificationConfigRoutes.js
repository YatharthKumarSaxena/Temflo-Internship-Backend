const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const salesVerificationConfigController = require('../../controllers/SalesControllers/SalesVerificationConfigController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Auth for all routes
router.use(adminAuth.isValidAuthToken);

router.route('/').get(catchErrors(salesVerificationConfigController.getVerificationConfig));

router
  .route('/maker-checker')
  .get(catchErrors(salesVerificationConfigController.getMakerCheckerConfig))
  .put(AdminOwner, catchErrors(salesVerificationConfigController.updateMakerCheckerConfig));

router
  .route('/available-checkers')
  .get(catchErrors(salesVerificationConfigController.getAvailableCheckers));

// Workflow settings
router
  .route('/workflow-settings')
  .get(catchErrors(salesVerificationConfigController.getWorkflowSettings))
  .put(AdminOwner, catchErrors(salesVerificationConfigController.updateWorkflowSettings));

// Notification settings
router
  .route('/notification-settings')
  .get(catchErrors(salesVerificationConfigController.getNotificationSettings))
  .put(AdminOwner, catchErrors(salesVerificationConfigController.updateNotificationSettings));

module.exports = router;
