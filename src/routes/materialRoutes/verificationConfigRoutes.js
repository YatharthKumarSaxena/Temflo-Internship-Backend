const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const verificationConfigController = require('../../controllers/MaterialControllers/verificationConfigController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Verification configuration routes
router
  .route('/')
  .get(catchErrors(verificationConfigController.getVerificationConfig))
  .put(AdminOwner, catchErrors(verificationConfigController.updateVerificationConfig));

router
  .route('/reset')
  .post(AdminOwner, catchErrors(verificationConfigController.resetVerificationConfig));

// Verification requirements routes
router
  .route('/requirements/:type')
  .get(catchErrors(verificationConfigController.getVerificationRequirements))
  .put(AdminOwner, catchErrors(verificationConfigController.updateVerificationRequirements));

// Maker-checker configuration routes
router
  .route('/maker-checker')
  .get(catchErrors(verificationConfigController.getMakerCheckerConfig))
  .put(AdminOwner, catchErrors(verificationConfigController.updateMakerCheckerConfig));

// Available checkers route
router
  .route('/available-checkers')
  .get(catchErrors(verificationConfigController.getAvailableCheckers));

module.exports = router;
