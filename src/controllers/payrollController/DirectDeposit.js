const DirectDeposit = require("../../models/parollModels/DirectDeposit");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { DIRECT_DEPOSIT_CREATED, DIRECT_DEPOSIT_UPDATED, DIRECT_DEPOSIT_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_directDeposit,
      modelAffected: [MODEL_AFFECTED.model_directDeposit],
      eventType: DIRECT_DEPOSIT_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: deposit.toObject(),
      description: `Direct deposit created by ${getFullName(req.admin.employeeInfo)}`
    });

    res.status(201).json(deposit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update direct deposit
exports.updateDirectDeposit = async (req, res) => {
  try {
    const existing = await DirectDeposit.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "DirectDeposit not found" });

    const updated = await DirectDeposit.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_directDeposit,
      modelAffected: [MODEL_AFFECTED.model_directDeposit],
      eventType: DIRECT_DEPOSIT_UPDATED,
      actionDone: ACTIONS.update,
      oldData: existing.toObject(),
      newData: updated.toObject(),
      description: `Direct deposit updated by ${getFullName(req.admin.employeeInfo)}`
    });

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_directDeposit,
      modelAffected: [MODEL_AFFECTED.model_directDeposit],
      eventType: DIRECT_DEPOSIT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null,
      description: `Direct deposit deleted by ${getFullName(req.admin.employeeInfo)}`
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};