const PayslipSettings = require("../../models/parollModels/PayslipSettings");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PAYSLIP_SETTINGS_UPDATED, PAYSLIP_SETTINGS_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// Get global settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await PayslipSettings.findOne();
    if (!settings) {
      settings = await PayslipSettings.create({});
    }
    setNoCache(res);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// Update global settings
exports.updateSettings = async (req, res) => {
  try {
    const payload = req.body;
    const allowed = ["leftToggles", "rightToggles", "docSettings"];
    const update = {};

    // Only allowed keys
    for (const key of allowed) {
      if (payload[key] !== undefined) update[key] = payload[key];
    }

    let settings = await PayslipSettings.findOne();

    if (!settings) {
      // If no settings exist, create new
      settings = await PayslipSettings.create(update);

      // Activity Tracker for creation
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_payslipSettings,
        modelAffected: [MODEL_AFFECTED.model_payslipSettings],
        eventType: PAYSLIP_SETTINGS_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: settings.toObject(),
        description: `Payslip settings created by ${getFullName(req.admin.employeeInfo)}`
      });
    } else {
      // Existing settings
      const oldObj = settings.toObject();
      Object.assign(settings, update);
      await settings.save();
      const newObj = settings.toObject();

      // Activity Tracker
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_payslipSettings,
        modelAffected: [MODEL_AFFECTED.model_payslipSettings],
        eventType: PAYSLIP_SETTINGS_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldObj,
        newData: newObj,
        description: `Payslip settings updated by ${getFullName(req.admin.employeeInfo)}`
      });
    }

    setNoCache(res);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};
