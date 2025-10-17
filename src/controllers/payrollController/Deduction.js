const Deduction = require("../../models/parollModels/Deduction");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};
// Get all deductions
exports.getAllDeductions = async (req, res) => {
  try {
    const deductions = await Deduction.find();
    setNoCache(res);
    res.json(deductions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get enabled deductions in frontend-friendly format
exports.getDeductionDetails = async (req, res) => {
  try {
    const deductions = await Deduction.find({ enabled: true });

    const deductionList = deductions.map(d => ({
      name: d.deductionName,
      code: d.deductionCode,
      rate: d.percentageValue || d.amount || 0,
      basedOn: d.percentageField || "custom", // "basicPay", "grossPay", or custom
      type: d.type,
      notes: d.notes || ""
    }));
    setNoCache(res);
    res.json(deductionList);
  } catch (err) {
    console.error("Error fetching deductions:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create deduction
exports.createDeduction = async (req, res) => {
  try {
    const deduction = new Deduction(req.body);
    await deduction.save();
    setNoCache(res);
    res.status(201).json(deduction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update deduction
exports.updateDeduction = async (req, res) => {
  try {
    const updated = await Deduction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Deduction not found" });
    setNoCache(res);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete deduction
exports.deleteDeduction = async (req, res) => {
  try {
    const deleted = await Deduction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Deduction not found" });
    setNoCache(res);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle enabled field
exports.toggleEnabled = async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);
    if (!deduction) return res.status(404).json({ message: "Not found" });

    deduction.enabled = req.body.enabled;
    await deduction.save();

    res.json(deduction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
