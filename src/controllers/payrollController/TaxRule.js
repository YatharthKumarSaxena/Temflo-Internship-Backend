const TaxRule = require("../../models/parollModels/TaxRule");

// GET all tax rules
exports.getAllTaxRules = async (req, res) => {
  try {
    const taxRules = await TaxRule.find();
    res.json(taxRules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE tax rule
exports.createTaxRule = async (req, res) => {
  try {
    const taxRule = await TaxRule.create(req.body);
    res.status(201).json(taxRule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE tax rule
exports.updateTaxRule = async (req, res) => {
  try {
    const updated = await TaxRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "TaxRule not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE tax rule
exports.deleteTaxRule = async (req, res) => {
  try {
    const deleted = await TaxRule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "TaxRule not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
