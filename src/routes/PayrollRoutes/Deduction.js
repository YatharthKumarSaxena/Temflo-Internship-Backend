const express = require("express");
const router = express.Router();
const deductionController = require("../../controllers/payrollController/Deduction");

// Routes
router.get("/", deductionController.getAllDeductions);
router.get("/deduction_details", deductionController.getDeductionDetails);
router.post("/", deductionController.createDeduction);
router.put("/:id", deductionController.updateDeduction);
router.delete("/:id", deductionController.deleteDeduction);
router.patch("/:id/enabled", deductionController.toggleEnabled);

module.exports = router;
