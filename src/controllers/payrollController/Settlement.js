const Settlement = require("../../models/parollModels/Settlement");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SETTLEMENT_CREATED, SETTLEMENT_DELETED, SETTLEMENT_UPDATED } = require("@/config/activity.enums");

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_settlement,
      modelAffected: [MODEL_AFFECTED.model_settlement],
      eventType: SETTLEMENT_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: settlement.toObject()
    });

    res.status(201).json(settlement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE a settlement
exports.updateSettlement = async (req, res) => {
  try {
    const existing = await Settlement.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Settlement not found" });

    const updated = await Settlement.findByIdAndUpdate(req.params.id, req.body, { new: true });

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
      fileAffected: FILE.file_settlement,
      modelAffected: [MODEL_AFFECTED.model_settlement],
      eventType: SETTLEMENT_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_settlement,
      modelAffected: [MODEL_AFFECTED.model_settlement],
      eventType: SETTLEMENT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};