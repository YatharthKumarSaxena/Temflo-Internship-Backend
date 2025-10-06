const Deduction = require("../../models/parollModels/Deduction");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { DEDUCTION_CREATED, DEDUCTION_UPDATED, DEDUCTION_DELETED, TOGGLE_ENABLED_DEDUCTION } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_deduction,
      modelAffected: [MODEL_AFFECTED.model_deduction],
      eventType: DEDUCTION_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: deduction.toObject(),
      description: `Deduction created by ${getFullName(req.admin.employeeInfo)}`
    });

    setNoCache(res);
    res.status(201).json(deduction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update deduction
exports.updateDeduction = async (req, res) => {
  try {
    const existing = await Deduction.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Deduction not found" });

    const updated = await Deduction.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_deduction,
      modelAffected: [MODEL_AFFECTED.model_deduction],
      eventType: DEDUCTION_UPDATED,
      actionDone: ACTIONS.update,
      oldData: existing.toObject(),
      newData: updated.toObject(),
      description: `Deduction updated by ${getFullName(req.admin.employeeInfo)}`
    });

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_deduction,
      modelAffected: [MODEL_AFFECTED.model_deduction],
      eventType: DEDUCTION_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null,
      description: `Deduction deleted by ${getFullName(req.admin.employeeInfo)}`
    });

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

    const oldData = deduction.toObject();

    deduction.enabled = req.body.enabled;
    await deduction.save();

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_deduction,
      modelAffected: [MODEL_AFFECTED.model_deduction],
      eventType: TOGGLE_ENABLED_DEDUCTION,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: { notes: `Deduction is ${deduction.enabled ? "enabled" : "disabled"}. Rest fields are same as old data`, enabled: deduction.enabled },
      description: `Deduction enabled status toggled by ${getFullName(req.admin.employeeInfo)}`
    });

    res.json(deduction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
