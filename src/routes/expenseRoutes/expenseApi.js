const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const ExpenseApi = require('@/controllers/ExpenseControllers/index');
const WalletController = require('@/controllers/ExpenseControllers/walletController');
const upload = require('../../services/file-upload');
const Expense = require('@/models/appModels/Expense');

// Expense Category Routes
router
  .route('/add-expense-category')
  .post(catchErrors(ExpenseApi.adminExpenseController.createExpenseCategory));
router
  .route('/get-expense-categories')
  .get(catchErrors(ExpenseApi.adminExpenseController.getExpenseCategory));
router
  .route('/edit-expense-category')
  .put(catchErrors(ExpenseApi.adminExpenseController.updateExpenseCategory));
router
  .route('/delete-expense-category/:expenseId')
  .delete(catchErrors(ExpenseApi.adminExpenseController.deleteExpenseRecord));

// Expense Form Routes
router
  .route('/add-expense-form')
  .post(catchErrors(ExpenseApi.adminExpenseController.saveExpenseForm));
router
  .route('/get-expense-form')
  .get(catchErrors(ExpenseApi.adminExpenseController.getExpenseForm));

// Expense Management Routes
router
  .route('/admin-claim-expense')
  .post(upload.array('files'), catchErrors(ExpenseApi.adminExpenseController.claimExpense));
router
  .route('/all-expenses/:plantId')
  .get(catchErrors(ExpenseApi.adminExpenseController.getExpenses));
router
  .route('/update-expense/:expenseId')
  .put(upload.array('files'), catchErrors(ExpenseApi.adminExpenseController.updateExpense));
router.route('/add-comment').post(catchErrors(ExpenseApi.adminExpenseController.addComment));

// Wallet Balance Routes
router.route('/wallet/add-balance').post(catchErrors(WalletController.addWalletBalance));
router.route('/wallet/balance/:employeeId?').get(catchErrors(WalletController.getWalletBalance));
router.route('/wallet/request-balance').post(catchErrors(WalletController.requestWalletBalance));
router
  .route('/wallet/transactions/:employeeId?')
  .get(catchErrors(WalletController.getWalletTransactions));
router
  .route('/wallet/process-request/:transactionId')
  .put(catchErrors(WalletController.processBalanceRequest));
router
  .route('/wallet/all-employee-balances')
  .get(catchErrors(WalletController.getAllEmployeeBalances));

module.exports = router;
