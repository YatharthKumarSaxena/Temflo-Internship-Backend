const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const tdsController = require('../../controllers/MaterialControllers/tdsController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes except dropdown
router.use((req, res, next) => {
  if (req.path === '/dropdown') {
    return next(); // Skip auth for dropdown
  }
  return adminAuth.isValidAuthToken(req, res, next);
});

// TDS Code CRUD routes
router
  .route('/')
  .post(AdminOwner, catchErrors(tdsController.createTDSCode))
  .get(catchErrors(tdsController.getTDSCodes));

router.route('/dropdown').get(catchErrors(tdsController.getTDSCodesDropdown));

router
  .route('/:id')
  .get(catchErrors(tdsController.getTDSCodeById))
  .put(AdminOwner, catchErrors(tdsController.updateTDSCode))
  .delete(AdminOwner, catchErrors(tdsController.deleteTDSCode));

module.exports = router;
