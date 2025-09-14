const SalaryTemplate = require("../../models/parollModels/SalaryTemplate");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SALARY_TEMPLATE_CREATED, SALARY_TEMPLATE_DELETED, SALARY_TEMPLATE_UPDATED } = require("@/config/activity.enums");

// GET all salary templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await SalaryTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new salary template
exports.createTemplate = async (req, res) => {
  try {
    const template = await SalaryTemplate.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_salaryTemplate,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplate],
      eventType: SALARY_TEMPLATE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: template.toObject()
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE salary template by ID
exports.updateTemplate = async (req, res) => {
  try {
    const existing = await SalaryTemplate.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Salary Template not found" });

    const updated = await SalaryTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });

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
      fileAffected: FILE.file_salaryTemplate,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplate],
      eventType: SALARY_TEMPLATE_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// DELETE salary template by ID
exports.deleteTemplate = async (req, res) => {
  try {
    const deleted = await SalaryTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Salary Template not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_salaryTemplate,
      modelAffected: [MODEL_AFFECTED.model_salaryTemplate],
      eventType: SALARY_TEMPLATE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
