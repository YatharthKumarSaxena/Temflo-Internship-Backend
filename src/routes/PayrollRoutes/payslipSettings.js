const express = require("express");
const { getSettings, updateSettings } = require("../../controllers/payrollController/PayslipSettings");

const router = express.Router();

router.get("/", getSettings);
router.put("/", updateSettings);

module.exports = router;
