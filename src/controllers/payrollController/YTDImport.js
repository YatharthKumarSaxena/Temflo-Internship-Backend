const YTDImport = require("../../models/parollModels/YTDImport");

// Get all records
exports.getAll = async (req, res) => {
  try {
    const records = await YTDImport.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single record by ID
exports.getById = async (req, res) => {
  try {
    const record = await YTDImport.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new record
exports.create = async (req, res) => {
  try {
    const record = new YTDImport(req.body);
    const saved = await record.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update record
exports.update = async (req, res) => {
  try {
    const updated = await YTDImport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Record not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete record
exports.delete = async (req, res) => {
  try {
    const deleted = await YTDImport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
