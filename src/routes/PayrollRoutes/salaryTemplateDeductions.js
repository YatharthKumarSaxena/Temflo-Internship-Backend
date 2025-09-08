const express = require("express");
const {
  getAllDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction
} = require("../../controllers/payrollController/SalaryTemplateDeduction");

const router = express.Router();

router.get("/", getAllDeductions);
router.post("/", createDeduction);
router.put("/:id", updateDeduction);
router.delete("/:id", deleteDeduction);

module.exports = router;
