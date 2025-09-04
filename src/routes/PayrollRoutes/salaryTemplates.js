const express = require("express");
const {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require("../../controllers/payrollController/SalaryTemplate");

const router = express.Router();

router.get("/", getAllTemplates);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

module.exports = router;
