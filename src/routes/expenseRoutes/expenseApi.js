const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const ExpenseApi = require('@/controllers/ExpenseControllers/index');
const WalletController = require('@/controllers/ExpenseControllers/walletController');
const upload = require('../../services/file-upload');
const Expense = require('@/models/appModels/Expense');
const checkPermission = require('@/middlewares/access/checkMiddleware')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')


// Expense Category Routes
router
  .route('/add-expense-category')
  .post(checkPermission('manage_expense'), requireWriteAccess, catchErrors(ExpenseApi.adminExpenseController.createExpenseCategory));
router
  .route('/edit-expense-category')
  .put(checkPermission('manage_expense'), requireWriteAccess, catchErrors(ExpenseApi.adminExpenseController.updateExpenseCategory));
router
  .route('/delete-expense-category/:expenseId')
  .delete(checkPermission('manage_expense'), requireWriteAccess, catchErrors(ExpenseApi.adminExpenseController.deleteExpenseRecord));

// Expense Form Routes
router
  .route('/add-expense-form')
  .post(checkPermission('manage_expense'), requireWriteAccess, catchErrors(ExpenseApi.adminExpenseController.saveExpenseForm));
// Expense Management Routes
router
  .route('/admin-claim-expense')
  .post(upload.array('files'), catchErrors(ExpenseApi.adminExpenseController.claimExpense));
router
  .route('/all-expenses/:plantId')
  .get(checkPermission('manage_expense'), requireReadAccess, catchErrors(ExpenseApi.adminExpenseController.getExpenses));
router
  .route('/employee-summary/:plantId')
  .get(checkPermission('manage_expense'), requireReadAccess, catchErrors(ExpenseApi.adminExpenseController.getEmployeeExpenseSummary));
router
  .route('/export-employee-expenses/:plantId/:employeeId')
  .get(catchErrors(ExpenseApi.adminExpenseController.exportEmployeeExpenses));
router
  .route('/export-dashboard-expenses/:plantId')
  .get(checkPermission('manage_expense'), requireReadAccess, catchErrors(ExpenseApi.adminExpenseController.exportDashboardExpenses));
router
  .route('/update-expense/:expenseId')
  .put(checkPermission('manage_expense'), requireWriteAccess, upload.array('files'), catchErrors(ExpenseApi.adminExpenseController.updateExpense));
router.route('/add-comment').post(catchErrors(ExpenseApi.adminExpenseController.addComment));

// Wallet Balance Routes
router.route('/wallet/add-balance').post(checkPermission('manage_expense'), requireWriteAccess, catchErrors(WalletController.addWalletBalance));
router.route('/wallet/request-balance').post(catchErrors(WalletController.requestWalletBalance));
router
  .route('/wallet/process-request/:transactionId')
  .put(checkPermission('manage_expense'), requireWriteAccess, catchErrors(WalletController.processBalanceRequest));
router
  .route('/wallet/all-employee-balances')
  .get(catchErrors(WalletController.getAllEmployeeBalances));

router
  .route('/get-expense-categories')
  .get(catchErrors(ExpenseApi.adminExpenseController.getExpenseCategory));

router
  .route('/get-expense-form')
  .get(catchErrors(ExpenseApi.adminExpenseController.getExpenseForm));

router.route('/wallet/balance/:employeeId?').get(catchErrors(WalletController.getWalletBalance));
router
  .route('/wallet/transactions/:employeeId?')
  .get(catchErrors(WalletController.getWalletTransactions));


module.exports = router;
