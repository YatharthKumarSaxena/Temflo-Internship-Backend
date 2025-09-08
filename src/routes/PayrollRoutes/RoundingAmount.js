const express = require("express");
const { getRoundingSetting, updateRoundingSetting } = require("../../controllers/payrollController/RoundingAmount.js");

const router = express.Router();

router.get("/", getRoundingSetting);
router.put("/", updateRoundingSetting);

module.exports = router;
