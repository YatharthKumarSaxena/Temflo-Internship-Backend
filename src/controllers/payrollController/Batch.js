const Batch = require("../../models/parollModels/Batch");

// Create Batch
exports.createBatch = async (req, res) => {
  const { name, createdBy } = req.body;
  if (!name || !createdBy) {
    return res.status(400).json({ message: "Name and Created By required" });
  }

  try {
    const batch = new Batch({ name, createdBy });
    const saved = await batch.save();
    res.set("Cache-Control", "no-store");

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all batches
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find();
    res.set("Cache-Control", "no-store");

    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get only batch names
exports.getBatchNames = async (req, res) => {
  try {
    const batches = await Batch.find({}, "name -_id");
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
