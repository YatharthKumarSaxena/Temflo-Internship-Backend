const Form = require("../../models/parollModels/Form");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { FORM_CREATED, FORM_UPDATED, FORM_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

// Get all forms
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create form
exports.createForm = async (req, res) => {
  try {
    const form = await Form.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_form,
      modelAffected: [MODEL_AFFECTED.model_form],
      eventType: FORM_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: form.toObject(),
      description: `Form created by ${getFullName(req.admin.employeeInfo)}`
    });

    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update form
exports.updateForm = async (req, res) => {
  try {
    const existing = await Form.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Form not found" });

    const updated = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_form,
      modelAffected: [MODEL_AFFECTED.model_form],
      eventType: FORM_UPDATED,
      actionDone: ACTIONS.update,
      oldData: existing.toObject(),
      newData: updated.toObject(),
      description: `Form updated by ${getFullName(req.admin.employeeInfo)}`
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Delete form
exports.deleteForm = async (req, res) => {
  try {
    const deleted = await Form.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Form not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_form,
      modelAffected: [MODEL_AFFECTED.model_form],
      eventType: FORM_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null,
      description: `Form deleted by ${getFullName(req.admin.employeeInfo)}`
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};