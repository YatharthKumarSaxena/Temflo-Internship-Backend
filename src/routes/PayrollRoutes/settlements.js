const express = require("express");
const {
  getAllSettlements,
  createSettlement,
  updateSettlement,
  deleteSettlement
} = require("../../controllers/payrollController/Settlement");

const router = express.Router();

router.get("/", getAllSettlements);
router.post("/", createSettlement);
router.put("/:id", updateSettlement);
router.delete("/:id", deleteSettlement);

module.exports = router;
