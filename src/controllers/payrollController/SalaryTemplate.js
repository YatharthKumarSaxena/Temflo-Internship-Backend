const SalaryTemplate = require("../../models/parollModels/SalaryTemplate");

// GET all salary templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await SalaryTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new salary template
exports.createTemplate = async (req, res) => {
  try {
    const template = await SalaryTemplate.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE salary template by ID
exports.updateTemplate = async (req, res) => {
  try {
    const updated = await SalaryTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Salary Template not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE salary template by ID
exports.deleteTemplate = async (req, res) => {
  try {
    const deleted = await SalaryTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Salary Template not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
