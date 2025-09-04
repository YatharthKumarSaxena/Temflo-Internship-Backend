const express = require("express");
const {
  getAllAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance
} = require("../../controllers/payrollController/SalaryTemplateAllowance");

const router = express.Router();

router.get("/", getAllAllowances);
router.post("/", createAllowance);
router.put("/:id", updateAllowance);
router.delete("/:id", deleteAllowance);

module.exports = router;

const SalaryTemplateAllowance = require('../../models/parollModels/SalaryTemplateAllowance');
const salaryTemplateAllowanceRouter = express.Router();
