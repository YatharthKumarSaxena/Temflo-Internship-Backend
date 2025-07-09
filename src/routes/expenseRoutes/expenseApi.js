const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const ExpenseApi = require('@/controllers/ExpenseControllers/index')
const upload = require('../../services/file-upload');
const Expense = require('@/models/appModels/Expense');

router.route('/add-expense-category').post(catchErrors(ExpenseApi.adminExpenseController.createExpenseCategory))
router.route('/get-expense-categories').get(catchErrors(ExpenseApi.adminExpenseController.getExpenseCategory))
router.route('/edit-expense-category').put(catchErrors(ExpenseApi.adminExpenseController.updateExpenseCategory))
router.route('/delete-expense-category/:expenseId').delete(catchErrors(ExpenseApi.adminExpenseController.deleteExpenseRecord))
router.route('/add-expense-form').post(catchErrors(ExpenseApi.adminExpenseController.saveExpenseForm))
router.route('/get-expense-form').get(catchErrors(ExpenseApi.adminExpenseController.getExpenseForm))

router.route('/admin-claim-expense').post(upload.array('files'),catchErrors(ExpenseApi.adminExpenseController.claimExpense))
router.route('/all-expenses/:plantId').get(catchErrors(ExpenseApi.adminExpenseController.getExpenses))

router.route('/update-expense/:expenseId').put(upload.array('files'),catchErrors(ExpenseApi.adminExpenseController.updateExpense))
router.route('/add-comment').post(catchErrors(ExpenseApi.adminExpenseController.addComment))
module.exports = router