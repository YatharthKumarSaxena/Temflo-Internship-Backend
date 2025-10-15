const Payslip = require("../../models/parollModels/Payslip");

// Get all payslips
exports.getPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find();
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a payslip
exports.createPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.create(req.body);
    res.status(201).json(payslip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a payslip
exports.updatePayslip = async (req, res) => {
  try {
    const updated = await Payslip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Payslip not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a payslip
exports.deletePayslip = async (req, res) => {
  try {
    const deleted = await Payslip.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payslip not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
