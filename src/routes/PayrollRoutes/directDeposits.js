const express = require("express");
const router = express.Router();
const directDepositController = require("../../controllers/payrollController/DirectDeposit");

// Routes
router.get("/", directDepositController.getAllDirectDeposits);
router.post("/", directDepositController.createDirectDeposit);
router.put("/:id", directDepositController.updateDirectDeposit);
router.delete("/:id", directDepositController.deleteDirectDeposit);

module.exports = router;
