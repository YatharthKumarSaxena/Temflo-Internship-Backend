const LoanRepayment = require("../../models/parollModels/LoanRepayment");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { LOAN_REPAYMENT_CREATED, LOAN_REPAYMENT_DELETED, LOAN_REPAYMENT_UPDATED } = require("@/config/activity.enums");

// Get all repayments
exports.getAllLoanRepayments = async (req, res) => {
  try {
    const repayments = await LoanRepayment.find();
    res.json(repayments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create repayment
exports.createLoanRepayment = async (req, res) => {
  try {
    const repayment = await LoanRepayment.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_loanRepayment,
      modelAffected: [MODEL_AFFECTED.model_loanRepayment],
      eventType: LOAN_REPAYMENT_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: repayment.toObject()
    });

    res.status(201).json(repayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update repayment
exports.updateLoanRepayment = async (req, res) => {
  try {
    const existing = await LoanRepayment.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Loan repayment not found" });

    const updated = await LoanRepayment.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 🔹 Extract changed fields
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
      fileAffected: FILE.file_loanRepayment,
      modelAffected: [MODEL_AFFECTED.model_loanRepayment],
      eventType: LOAN_REPAYMENT_UPDATED,
      actionDone: ACTIONS.update,
      oldData,
      newData
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete repayment
exports.deleteLoanRepayment = async (req, res) => {
  try {
    const deleted = await LoanRepayment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Loan repayment not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_loanRepayment,
      modelAffected: [MODEL_AFFECTED.model_loanRepayment],
      eventType: LOAN_REPAYMENT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
