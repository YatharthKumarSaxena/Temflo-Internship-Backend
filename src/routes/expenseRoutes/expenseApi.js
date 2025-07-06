const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const ExpenseApi = require('@/controllers/ExpenseControllers/index')

router.route('/add-expense-category').post(catchErrors(ExpenseApi.adminExpenseController.createExpenseCategory))
router.route('/get-expense-categories').get(catchErrors(ExpenseApi.adminExpenseController.getExpenseCategory))
router.route('/edit-expense-category').put(catchErrors(ExpenseApi.adminExpenseController.updateExpenseCategory))
router.route('/delete-expense-category/:expenseId').delete(catchErrors(ExpenseApi.adminExpenseController.deleteExpenseRecord))
router.route('/add-expense-form').post(catchErrors(ExpenseApi.adminExpenseController.saveExpenseForm))
router.route('/get-expense-form').get(catchErrors(ExpenseApi.adminExpenseController.getExpenseForm))



module.exports = router