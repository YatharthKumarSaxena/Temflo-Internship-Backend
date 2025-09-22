const Payslip = require("../../models/parollModels/Payslip");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PAYSLIP_CREATED, PAYSLIP_UPDATED, PAYSLIP_DELETED } = require("@/config/activity.enums");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// Get all payslips
exports.getPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find();
    setNoCache(res);
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a payslip
exports.createPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.create(req.body);

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_payslip,
      modelAffected: [MODEL_AFFECTED.model_payslip],
      eventType: PAYSLIP_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: payslip.toObject()
    });

    setNoCache(res);
    res.status(201).json(payslip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a payslip
exports.updatePayslip = async (req, res) => {
  try {
    const existing = await Payslip.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Payslip not found" });

    const updated = await Payslip.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 🔹 Extract only changed fields
    const oldData = {};
    const newData = {};
    const oldObj = existing.toObject();
    const newObj = updated.toObject();

    for (let key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        oldData[key] = oldObj[key]; // pehle ka value
        newData[key] = newObj[key];  // update ke baad ka value
      }
    }

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_payslip,
      modelAffected: [MODEL_AFFECTED.model_payslip],
      eventType: PAYSLIP_UPDATED,
      actionDone: ACTIONS.update,
      oldData,   // sirf changed fields ke old values
      newData    // sirf changed fields ke new values
    });

    setNoCache(res);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Delete a payslip
exports.deletePayslip = async (req, res) => {
  try {
    const deleted = await Payslip.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payslip not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_payslip,
      modelAffected: [MODEL_AFFECTED.model_payslip],
      eventType: PAYSLIP_DELETED,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null
    });

    setNoCache(res);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};