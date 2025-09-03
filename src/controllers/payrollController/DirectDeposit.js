const DirectDeposit = require("../../models/parollModels/DirectDeposit");

// Get all direct deposits
exports.getAllDirectDeposits = async (req, res) => {
  try {
    const deposits = await DirectDeposit.find();
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create direct deposit
exports.createDirectDeposit = async (req, res) => {
  try {
    const deposit = await DirectDeposit.create(req.body);
    res.status(201).json(deposit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update direct deposit
exports.updateDirectDeposit = async (req, res) => {
  try {
    const updated = await DirectDeposit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "DirectDeposit not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete direct deposit
exports.deleteDirectDeposit = async (req, res) => {
  try {
    const deleted = await DirectDeposit.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "DirectDeposit not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
