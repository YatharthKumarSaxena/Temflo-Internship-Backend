const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/SalesControllers/CustomerController');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Auth for all customer routes
router.use(adminAuth.isValidAuthToken);

// Customer CRUD routes
router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/stats', customerController.getCustomerStats);
router.get('/master-data', customerController.getMasterData);
router.get('/validate-gstin', customerController.validateGstin);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

// Maker-checker routes
router.post('/:id/assign-checker', AdminOwner, customerController.assignChecker);
router.post('/:id/checker-action', AdminOwner, customerController.checkerAction);

module.exports = router;
