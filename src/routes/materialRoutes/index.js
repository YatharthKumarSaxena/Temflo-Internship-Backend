const express = require('express');
const router = express.Router();

const supplierRoutes = require('./supplierRoutes');
const materialRoutes = require('./materialRoutes');
const hsnRoutes = require('./hsnRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const purchaseOrderBookingRoutes = require('./purchaseOrderBookingRoutes');
const plantRoutes = require('./plantRoutes');
const generalLedgerRoutes = require('./generalLedgerRoutes');
const tdsRoutes = require('./tdsRoutes');

// Material Management routes
router.use('/suppliers', supplierRoutes);
router.use('/materials', materialRoutes);
router.use('/hsn', hsnRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/purchase-order-bookings', purchaseOrderBookingRoutes);
router.use('/plants', plantRoutes);
router.use('/general-ledger', generalLedgerRoutes);
router.use('/tds-codes', tdsRoutes);

module.exports = router;
