const SalaryTemplateDeduction = require("../../models/parollModels/SalaryTemplateDeduction");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SALARY_TEMPLATE_DEDUCTION_CREATED, SALARY_TEMPLATE_DEDUCTION_DELETED, SALARY_TEMPLATE_DEDUCTION_UPDATED } = require("@/config/activity.enums");

// GET all deductions
exports.getAllDeductions = async (req, res) => {
  try {
    const deductions = await SalaryTemplateDeduction.find();
    res.json(deductions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE deduction
exports.createDeduction = async (req, res) => {
  try {
    const deduction = await SalaryTemplateDeduction.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_salaryTemplateDeduction,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplateDeduction],
      eventType: SALARY_TEMPLATE_DEDUCTION_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: deduction.toObject()
    });

    res.status(201).json(deduction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE deduction by ID
exports.updateDeduction = async (req, res) => {
  try {
    const existing = await SalaryTemplateDeduction.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Deduction not found" });

    const updated = await SalaryTemplateDeduction.findByIdAndUpdate(req.params.id, req.body, { new: true });

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
      fileAffected: FILE.file_salaryTemplateDeduction,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplateDeduction],
      eventType: SALARY_TEMPLATE_DEDUCTION_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// DELETE deduction by ID
exports.deleteDeduction = async (req, res) => {
  try {
    const deleted = await SalaryTemplateDeduction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Deduction not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_salaryTemplateDeduction,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplateDeduction],
      eventType: SALARY_TEMPLATE_DEDUCTION_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};