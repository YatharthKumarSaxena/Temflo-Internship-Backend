const YTDImport = require("../../models/parollModels/YTDImport");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { YTD_IMPORT_CREATED, YTD_IMPORT_DELETED, YTD_IMPORT_UPDATED } = require("@/config/activity.enums");

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_YTDImport,
      modelAffected: [MODEL_AFFECTED.model_YTDImport],
      eventType: YTD_IMPORT_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: saved.toObject()
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update YTD Import record
exports.update = async (req, res) => {
  try {
    const existing = await YTDImport.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Record not found" });

    const updated = await YTDImport.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 🔹 Extract only changed fields
    const oldData = {};
    const newData = {};
    const oldObj = existing.toObject();
    const newObj = updated.toObject();

    for (let key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        oldData[key] = oldObj[key];
        newData[key] = newObj[key];
      }
    }

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_YTDImport,
      modelAffected: [MODEL_AFFECTED.model_YTDImport],
      eventType: YTD_IMPORT_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_YTDImport,
      modelAffected: [MODEL_AFFECTED.model_YTDImport],
      eventType: YTD_IMPORT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};