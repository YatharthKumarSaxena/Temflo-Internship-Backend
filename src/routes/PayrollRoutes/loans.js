const express = require("express");
const router = express.Router();
const loanController = require("../../controllers/payrollController/Loan");

// Routes
router.get("/", loanController.getAllLoans);
router.post("/", loanController.createLoan);
router.put("/:id", loanController.updateLoan);
router.delete("/:id", loanController.deleteLoan);

module.exports = router;
