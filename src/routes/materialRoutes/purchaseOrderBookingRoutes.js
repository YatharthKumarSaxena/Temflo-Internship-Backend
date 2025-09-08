const express = require('express');
const router = express.Router();
const purchaseOrderBookingController = require('../../controllers/MaterialControllers/purchaseOrderBookingController');
const { catchErrors } = require('../../handlers/errorHandlers');
const adminAuth = require('../../controllers/coreControllers/adminAuth');
const AdminOwner = require('../../middlewares/access/AdminOwner');

// Apply authentication middleware to all routes
router.use(adminAuth.isValidAuthToken);

// Booking CRUD routes
router.route('/').post(AdminOwner, catchErrors(purchaseOrderBookingController.createBooking));

router
  .route('/purchase-order/:purchaseOrderId')
  .get(catchErrors(purchaseOrderBookingController.getBookingsByPurchaseOrder));

router
  .route('/summary/:purchaseOrderId')
  .get(catchErrors(purchaseOrderBookingController.getBookingSummary));

router
  .route('/:bookingId/cancel')
  .put(AdminOwner, catchErrors(purchaseOrderBookingController.cancelBooking));

router
  .route('/:bookingId')
  .delete(AdminOwner, catchErrors(purchaseOrderBookingController.deleteBooking));

module.exports = router;
