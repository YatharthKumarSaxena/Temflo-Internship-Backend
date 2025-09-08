const express = require("express");
const {
  createBatch,
  getBatches,
  getBatchNames,
} = require("../../controllers/payrollController/Batch");

const router = express.Router();

router.post("/", createBatch);
router.get("/", getBatches);
router.get("/names", getBatchNames);

module.exports = router;
