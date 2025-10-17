// src/routes/PayrollRoutes/payrollAPI.js
const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const upload = require('../../services/file-upload');

// Controllers
const payrollApi = require('./../../controllers/payrollController');

// ========================
// PAY PERIOD
// ========================
router.route('/payperiod')
  .get(catchErrors(payrollApi.PayPeriod.getPayPeriod))
  .post(catchErrors(payrollApi.PayPeriod.create))
  .put(catchErrors(payrollApi.PayPeriod.updatePayPeriod));

// ========================
// TDS CONFIG
// ========================
router.route('/tds')
  .get(catchErrors(payrollApi.TDSConfig.getTDSConfig))
  .put(catchErrors(payrollApi.TDSConfig.updateTDSConfig));

// ========================
// PAYSLIP SETTINGS
// ========================
router.route('/payslipsettings')
  .get(catchErrors(payrollApi.PayslipSettings.getSettings))
  .put(catchErrors(payrollApi.PayslipSettings.updateSettings));

// ========================
// ROUNDING SETTINGS
// ========================
router.route('/rounding')
  .get(catchErrors(payrollApi.RoundingSetting.getRoundingSetting))
  .put(catchErrors(payrollApi.RoundingSetting.updateRoundingSetting));

// ========================
// USERS
// ========================
router.route('/users')
  .get(catchErrors(payrollApi.Users.getAllUsers))
  .post(catchErrors(payrollApi.Users.createUser));

router.route('/users/:id')
  .get(catchErrors(payrollApi.Users.getUserById))
  .put(catchErrors(payrollApi.Users.updateUser))
  .delete(catchErrors(payrollApi.Users.deleteUser));

// router.route('/users')
//   .get(catchErrors(payrollApi.Users.getAll))
//   .post(catchErrors(payrollApi.Users.create));

// router.route('/users/:id')
//   .get(catchErrors(payrollApi.Users.getById))
//   .put(catchErrors(payrollApi.Users.update))
//   .delete(catchErrors(payrollApi.Users.delete));

// ========================
// USER WITH BATCH
// ========================
router.route('/sync')
  .post(catchErrors(payrollApi.UserWithBatch.syncUsers));

router.route('/get_active_users_with_batch')
  .get(catchErrors(payrollApi.UserWithBatch.getActiveUsersWithBatch));



router.route('/user_with_batch')
  .get(catchErrors(payrollApi.UserWithBatch.getAllUsers))
  .post(catchErrors(payrollApi.UserWithBatch.createUser));

router.route('/user_with_batch/:id')
  .get(catchErrors(payrollApi.UserWithBatch.getUserById))
  .put(catchErrors(payrollApi.UserWithBatch.updateUser))
  .delete(catchErrors(payrollApi.UserWithBatch.deleteUser));



// router.route('/user_with_batch/:id')
//   .get(catchErrors(payrollApi.UserWithBatch.getUserById))
//   .put(catchErrors(payrollApi.UserWithBatch.update))
//   .delete(catchErrors(payrollApi.UserWithBatch.delete));

// router.route('/user_with_batch/sync')
//   .post(catchErrors(payrollApi.UserWithBatch.syncUsers));


// ========================
// BATCHES
// ========================
router.route('/batches')
  .get(catchErrors(payrollApi.Batches.getBatches))
  .post(catchErrors(payrollApi.Batches.createBatch));

router.route('/batches/:id')
  .put(catchErrors(payrollApi.Batches.update))
  .delete(catchErrors(payrollApi.Batches.delete));

// ========================
// ALLOWANCES
// ========================
router.route('/allowances')
  .get(catchErrors(payrollApi.Allowances.getAllowances))
  .post(catchErrors(payrollApi.Allowances.createAllowance));

// router.route('/allowances/:id')
//   .put(catchErrors(payrollApi.Allowances.update))
//   .delete(catchErrors(payrollApi.Allowances.delete));

// ========================
// DEDUCTIONS
// ========================
router.route('/deductions')
  .get(catchErrors(payrollApi.Deductions.getDeductionDetails))
  .post(catchErrors(payrollApi.Deductions.createDeduction));

router.route('/deductions/:id')
  .put(catchErrors(payrollApi.Deductions.updateDeduction))
  .delete(catchErrors(payrollApi.Deductions.deleteDeduction));

// ========================
// COMPENSATIONS
// ========================
router.route('/compensations')
  .get(catchErrors(payrollApi.Compensations.getCompensations))
  .post(catchErrors(payrollApi.Compensations.createCompensation));

router.route('/compensations/:id')
  .put(catchErrors(payrollApi.Compensations.updateCompensation))
  .delete(catchErrors(payrollApi.Compensations.deleteCompensation));



// ========================
// SALARY BY BATCH
// ========================
router.route('/salary_by_batch')
  .get(catchErrors(payrollApi.Compensations.getSalaryByBatch));

// ========================
// COMPENSATION BY ID
// ========================
router.route('/compensations/:id')
  .get(catchErrors(payrollApi.Compensations.getCompensationById));


// ========================
// ADVANCE / LOAN
// ========================
router.route('/advance_loan')
  .get(catchErrors(payrollApi.AdvanceLoan.getAdvanceLoans))
  .post(catchErrors(payrollApi.AdvanceLoan.createAdvanceLoan));

router.route('/advance_loan/:id')
  .get(catchErrors(payrollApi.AdvanceLoan.getAdvanceLoanById))
  .put(catchErrors(payrollApi.AdvanceLoan.updateAdvanceLoan))
  .delete(catchErrors(payrollApi.AdvanceLoan.deleteAdvanceLoan));







module.exports = router;
