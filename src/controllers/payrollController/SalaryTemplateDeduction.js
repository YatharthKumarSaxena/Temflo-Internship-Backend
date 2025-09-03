const SalaryTemplateDeduction = require("../../models/parollModels/SalaryTemplateDeduction");

// GET all deductions
exports.getAllDeductions = async (req, res) => {
  try {
    const deductions = await SalaryTemplateDeduction.find();
    res.json(deductions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE deduction
exports.createDeduction = async (req, res) => {
  try {
    const deduction = await SalaryTemplateDeduction.create(req.body);
    res.status(201).json(deduction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE deduction by ID
exports.updateDeduction = async (req, res) => {
  try {
    const updated = await SalaryTemplateDeduction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Deduction not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE deduction by ID
exports.deleteDeduction = async (req, res) => {
  try {
    const deleted = await SalaryTemplateDeduction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Deduction not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
