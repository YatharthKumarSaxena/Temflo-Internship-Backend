const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const materialController = require('../../controllers/MaterialControllers/materialController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Material CRUD routes
router
  .route('/')
  .post(AdminOwner, catchErrors(materialController.createMaterial))
  .get(catchErrors(materialController.getMaterials));

router.route('/dropdown').get(catchErrors(materialController.getMaterialsDropdown));

router.route('/category/:category').get(catchErrors(materialController.getMaterialsByCategory));

router.route('/stats').get(catchErrors(materialController.getMaterialStats));

router
  .route('/:id')
  .get(catchErrors(materialController.getMaterialById))
  .put(AdminOwner, catchErrors(materialController.updateMaterial))
  .delete(AdminOwner, catchErrors(materialController.deleteMaterial));

module.exports = router;
