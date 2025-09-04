const Settlement = require("../../models/parollModels/Settlement");

// GET all settlements
exports.getAllSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find();
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a settlement
exports.createSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.create(req.body);
    res.status(201).json(settlement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE a settlement
exports.updateSettlement = async (req, res) => {
  try {
    const updated = await Settlement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Settlement not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE a settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const deleted = await Settlement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Settlement not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
