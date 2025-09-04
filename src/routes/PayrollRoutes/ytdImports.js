const express = require("express");
const router = express.Router();
const ytdImportController = require("../../controllers/payrollController/YTDImport");

router.get("/", ytdImportController.getAll);
router.get("/:id", ytdImportController.getById);
router.post("/", ytdImportController.create);
router.put("/:id", ytdImportController.update);
router.delete("/:id", ytdImportController.delete);

module.exports = router;
