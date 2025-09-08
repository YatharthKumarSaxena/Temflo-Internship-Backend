const express = require("express");
const router = express.Router();
const payPeriodController = require("../../controllers/payrollController/PayPeriod");

// Routes
router.get("/", payPeriodController.getPayPeriod);
router.put("/", payPeriodController.updatePayPeriod);

module.exports = router;
