const express = require("express");
const {
  createCompensation,
  getCompensations,
  getSalaryByBatch,
  getCompensationById,
  updateCompensation,
  deleteCompensation,
} = require("../../controllers/payrollController/Compensation");

const router = express.Router();

router.post("/", createCompensation);
router.get("/", getCompensations);
router.get("/salary", getSalaryByBatch);
router.get("/:id", getCompensationById);
router.put("/:id", updateCompensation);
router.delete("/:id", deleteCompensation);

module.exports = router;
