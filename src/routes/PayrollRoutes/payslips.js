const express = require("express");
const {
  getPayslips,
  createPayslip,
  updatePayslip,
  deletePayslip,
} = require("../../controllers/payrollController/Payslip");

const router = express.Router();

router.get("/", getPayslips);
router.post("/", createPayslip);
router.put("/:id", updatePayslip);
router.delete("/:id", deletePayslip);

module.exports = router;
