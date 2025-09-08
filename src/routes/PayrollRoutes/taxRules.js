const express = require("express");
const {
  getAllTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule
} = require("../../controllers/payrollController/TaxRule");

const router = express.Router();

router.get("/", getAllTaxRules);
router.post("/", createTaxRule);
router.put("/:id", updateTaxRule);
router.delete("/:id", deleteTaxRule);

module.exports = router;
