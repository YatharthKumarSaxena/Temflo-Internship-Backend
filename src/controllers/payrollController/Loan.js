const Loan = require("../../models/parollModels/Loan");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { LOAN_CREATED, LOAN_DELETED, LOAN_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

// Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find();
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create loan
exports.createLoan = async (req, res) => {
  try {
    const loan = await Loan.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_loan,
      modelAffected: [MODEL_AFFECTED.model_loan],
      eventType: LOAN_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: loan.toObject(),
      description: `Loan created by ${getFullName(req.admin.employeeInfo)}`
    });

    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const existing = await Loan.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Loan not found" });

    const updated = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_loan,
      modelAffected: [MODEL_AFFECTED.model_loan],
      eventType: LOAN_UPDATED,
      actionDone: ACTIONS.update,
      oldData: existing.toObject(),
      newData: updated.toObject(),
      description: `Loan updated by ${getFullName(req.admin.employeeInfo)}`
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Delete loan
exports.deleteLoan = async (req, res) => {
  try {
    const deleted = await Loan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Loan not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_loan,
      modelAffected: [MODEL_AFFECTED.model_loan],
      eventType: LOAN_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null,
      description: `Loan deleted by ${getFullName(req.admin.employeeInfo)}`
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};