const express = require('express');
const router = express.Router();
const generalLedgerController = require('../../controllers/MaterialControllers/generalLedgerController');
const { catchErrors } = require('@/handlers/errorHandlers');

// Create new general ledger account
router.post('/', catchErrors(generalLedgerController.createGeneralLedger));

// Get all general ledger accounts with pagination and filters
router.get('/', catchErrors(generalLedgerController.getGeneralLedgerAccounts));

// Get general ledger accounts for dropdown (active only)
router.get('/dropdown', catchErrors(generalLedgerController.getGeneralLedgerDropdown));

// Get general ledger accounts by type
router.get('/type/:accountType', catchErrors(generalLedgerController.getGeneralLedgerByType));

// Get general ledger account by ID
router.get('/:id', catchErrors(generalLedgerController.getGeneralLedgerById));

// Update general ledger account
router.put('/:id', catchErrors(generalLedgerController.updateGeneralLedger));

// Delete general ledger account
router.delete('/:id', catchErrors(generalLedgerController.deleteGeneralLedger));

module.exports = router;
