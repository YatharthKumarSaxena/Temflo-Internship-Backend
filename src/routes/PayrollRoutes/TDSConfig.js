const express = require("express");
const { getTDSConfig, updateTDSConfig } = require("../../controllers/payrollController/TDSConfig");

const router = express.Router();

router.get("/", getTDSConfig);
router.put("/", updateTDSConfig);

module.exports = router;
