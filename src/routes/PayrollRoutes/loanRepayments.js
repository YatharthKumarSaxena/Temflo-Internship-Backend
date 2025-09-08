const express = require("express");
const router = express.Router();
const loanRepaymentController = require("../../controllers/payrollController/LoanRepayment");

// Routes
router.get("/", loanRepaymentController.getAllLoanRepayments);
router.post("/", loanRepaymentController.createLoanRepayment);
router.put("/:id", loanRepaymentController.updateLoanRepayment);
router.delete("/:id", loanRepaymentController.deleteLoanRepayment);

module.exports = router;
