const express = require('express');
const router = express.Router();
const salesOrderController = require('../../controllers/SalesControllers/SalesOrderController');

// Sales Order CRUD routes
router.post('/', salesOrderController.createSalesOrder);
router.get('/', salesOrderController.getSalesOrders);
router.get('/stats', salesOrderController.getSalesOrderStats);
router.get('/master-data', salesOrderController.getMasterData);
router.get('/plant/:plantId/segments', salesOrderController.getSegmentsForPlant);
router.get('/:id', salesOrderController.getSalesOrderById);
router.put('/:id', salesOrderController.updateSalesOrder);
router.put('/:id/approve', salesOrderController.approveSalesOrder);
router.put('/:id/reject', salesOrderController.rejectSalesOrder);
router.delete('/:id', salesOrderController.deleteSalesOrder);

module.exports = router;
