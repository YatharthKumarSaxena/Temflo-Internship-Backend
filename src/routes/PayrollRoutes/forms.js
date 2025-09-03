const express = require("express");
const router = express.Router();
const formController = require("../../controllers/payrollController/Form");

// Routes
router.get("/", formController.getAllForms);
router.post("/", formController.createForm);
router.put("/:id", formController.updateForm);
router.delete("/:id", formController.deleteForm);

module.exports = router;
