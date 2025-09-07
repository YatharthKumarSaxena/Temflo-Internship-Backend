const express = require('express');
const router = express.Router();

const supplierRoutes = require('./supplierRoutes');
const materialRoutes = require('./materialRoutes');
const hsnRoutes = require('./hsnRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const plantRoutes = require('./plantRoutes');
const generalLedgerRoutes = require('./generalLedgerRoutes');

// Material Management routes
router.use('/suppliers', supplierRoutes);
router.use('/materials', materialRoutes);
router.use('/hsn', hsnRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/plants', plantRoutes);
router.use('/general-ledger', generalLedgerRoutes);

module.exports = router;
