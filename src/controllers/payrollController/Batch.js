const Batch = require("../../models/parollModels/Batch");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { BATCH_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

// Create Batch
exports.createBatch = async (req, res) => {
  const { name, createdBy } = req.body;
  if (!name || !createdBy) {
    return res.status(400).json({ message: "Name and Created By required" });
  }

  try {
    const batch = new Batch({ name, createdBy });
    const saved = await batch.save();
    
    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_batch,
      modelAffected: [MODEL_AFFECTED.model_batch],
      eventType: BATCH_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: saved.toObject(),
      description: `Batch created by ${getFullName(req.admin.employeeInfo)}`
    });

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
