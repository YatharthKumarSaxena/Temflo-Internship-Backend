const TaxRule = require("../../models/parollModels/TaxRule");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TAX_RULE_CREATED, TAX_RULE_DELETED, TAX_RULE_UPDATED } = require("@/config/activity.enums");

// GET all tax rules
exports.getAllTaxRules = async (req, res) => {
  try {
    const taxRules = await TaxRule.find();
    res.json(taxRules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE tax rule
exports.createTaxRule = async (req, res) => {
  try {
    const taxRule = await TaxRule.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_taxRule,
      modelAffected: [MODEL_AFFECTED.model_taxRule],
      eventType: TAX_RULE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: taxRule.toObject()
    });

    res.status(201).json(taxRule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE tax rule
exports.updateTaxRule = async (req, res) => {
  try {
    const existing = await TaxRule.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "TaxRule not found" });

    const updated = await TaxRule.findByIdAndUpdate(req.params.id, req.body, { new: true });

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
      fileAffected: FILE.file_taxRule,
      modelAffected: [MODEL_AFFECTED.model_taxRule],
      eventType: TAX_RULE_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// DELETE tax rule
exports.deleteTaxRule = async (req, res) => {
  try {
    const deleted = await TaxRule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "TaxRule not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_taxRule,
      modelAffected: [MODEL_AFFECTED.model_taxRule],
      eventType: TAX_RULE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};