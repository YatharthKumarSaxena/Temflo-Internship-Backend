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

router
  .route('/:id')
  .get(catchErrors(supplierController.getSupplierById))
  .put(AdminOwner, catchErrors(supplierController.updateSupplier))
  .delete(AdminOwner, catchErrors(supplierController.deleteSupplier));

module.exports = router;
