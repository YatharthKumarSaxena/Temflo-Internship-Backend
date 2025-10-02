const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const hsnController = require('../../controllers/MaterialControllers/hsnController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// HSN Code CRUD routes
router
  .route('/')
  .post(AdminOwner, catchErrors(hsnController.createHSNCode))
  .get(catchErrors(hsnController.getHSNCodes));

router.route('/dropdown').get(catchErrors(hsnController.getHSNCodesDropdown));

router.route('/category/:category').get(catchErrors(hsnController.getHSNCodesByCategory));

router.route('/stats').get(catchErrors(hsnController.getHSNStats));

router
  .route('/bulk-import')
  .post(AdminOwner, catchErrors(hsnController.bulkImportHSNCodes));

router
  .route('/:id')
  .get(catchErrors(hsnController.getHSNCodeById))
  .put(AdminOwner, catchErrors(hsnController.updateHSNCode))
  .delete(AdminOwner, catchErrors(hsnController.deleteHSNCode));

module.exports = router;
