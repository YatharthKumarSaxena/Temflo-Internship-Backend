const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const supplierController = require('../../controllers/MaterialControllers/supplierController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Supplier CRUD routes
router
  .route('/')
  .post(AdminOwner, catchErrors(supplierController.createSupplier))
  .get(catchErrors(supplierController.getSuppliers));

router.route('/dropdown').get(catchErrors(supplierController.getSuppliersDropdown));

router.route('/validate-gstin').post(catchErrors(supplierController.validateGSTIN));

router.route('/master-data').get(catchErrors(supplierController.getMasterData));

router
  .route('/:id')
  .get(catchErrors(supplierController.getSupplierById))
  .put(AdminOwner, catchErrors(supplierController.updateSupplier))
  .delete(AdminOwner, catchErrors(supplierController.deleteSupplier));

router
  .route('/:id/submit-approval')
  .post(AdminOwner, catchErrors(supplierController.submitForApproval));

router.route('/:id/approve').post(AdminOwner, catchErrors(supplierController.approveSupplier));

module.exports = router;
