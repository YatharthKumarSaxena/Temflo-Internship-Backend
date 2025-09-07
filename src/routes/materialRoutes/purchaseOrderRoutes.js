const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const purchaseOrderController = require('../../controllers/MaterialControllers/purchaseOrderController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Purchase Order routes
router
  .route('/')
  .post(AdminOwner, catchErrors(purchaseOrderController.createPurchaseOrder))
  .get(catchErrors(purchaseOrderController.getPurchaseOrders));

router
  .route('/pending')
  .get(AdminOwner, catchErrors(purchaseOrderController.getPendingPurchaseOrders));

router.route('/materials').get(catchErrors(purchaseOrderController.getMaterialsForPO));

router.route('/stats').get(catchErrors(purchaseOrderController.getPurchaseOrderStats));

router
  .route('/:id')
  .get(catchErrors(purchaseOrderController.getPurchaseOrderById))
  .put(AdminOwner, catchErrors(purchaseOrderController.updatePurchaseOrder))
  .delete(AdminOwner, catchErrors(purchaseOrderController.deletePurchaseOrder));

router
  .route('/:id/submit')
  .post(AdminOwner, catchErrors(purchaseOrderController.submitForApproval));

router
  .route('/:id/approve')
  .post(AdminOwner, catchErrors(purchaseOrderController.approvePurchaseOrder));

// Plant mapping routes
router.route('/plant-mappings/:plantId').get(catchErrors(purchaseOrderController.getPlantMappings));

router
  .route('/cost-centres/:plantId/:segmentId')
  .get(catchErrors(purchaseOrderController.getCostCentresForPlantSegment));

module.exports = router;
