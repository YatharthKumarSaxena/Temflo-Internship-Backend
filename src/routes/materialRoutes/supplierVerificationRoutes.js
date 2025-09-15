const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const supplierVerificationController = require('../../controllers/MaterialControllers/supplierVerificationController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Field verification route (for real-time verification in forms)
router
  .route('/verify-field')
  .post(
    AdminOwner,
    catchErrors(supplierVerificationController.verifyField.bind(supplierVerificationController))
  );

// Supplier verification routes
router
  .route('/:id/verify')
  .post(
    AdminOwner,
    catchErrors(supplierVerificationController.verifySupplier.bind(supplierVerificationController))
  );

router
  .route('/:id/verify-all')
  .post(
    AdminOwner,
    catchErrors(
      supplierVerificationController.verifyAllSupplierDetails.bind(supplierVerificationController)
    )
  );

router
  .route('/:id/verification-status')
  .get(
    catchErrors(
      supplierVerificationController.getVerificationStatus.bind(supplierVerificationController)
    )
  );

router
  .route('/:id/manual-override')
  .post(
    AdminOwner,
    catchErrors(
      supplierVerificationController.manualVerificationOverride.bind(supplierVerificationController)
    )
  );

// Maker-checker routes
router
  .route('/:id/assign-checker')
  .post(
    AdminOwner,
    catchErrors(supplierVerificationController.assignChecker.bind(supplierVerificationController))
  );

router
  .route('/:id/checker-action')
  .post(
    AdminOwner,
    catchErrors(supplierVerificationController.checkerAction.bind(supplierVerificationController))
  );

module.exports = router;
