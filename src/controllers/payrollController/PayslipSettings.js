const PayslipSettings = require("../../models/parollModels/PayslipSettings");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PAYSLIP_SETTINGS_UPDATED } = require("@/config/activity.enums");

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
        eventType: PAYSLIP_SETTINGS_UPDATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: update
      });
    } else {
      // Existing settings
      const oldObj = settings.toObject();
      Object.assign(settings, update);
      await settings.save();
      const newObj = settings.toObject();

      // 🔹 Extract only changed fields
      const oldData = {};
      const newData = {};
      for (const key of allowed) {
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
        fileAffected: FILE.file_payslipSettings,
        modelAffected: [MODEL_AFFECTED.model_payslipSettings],
        eventType: PAYSLIP_SETTINGS_UPDATED,
        actionDone: ACTIONS.update,
        oldData,
        newData
      });
    }

    setNoCache(res);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};
