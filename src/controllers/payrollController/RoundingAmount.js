const RoundingSetting = require("../../models/parollModels/RoundingAmount");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { ROUNDING_SETTING_UPDATED, ROUNDING_SETTING_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// Get current setting
exports.getRoundingSetting = async (req, res) => {
  try {
    let setting = await RoundingSetting.findOne();
    if (!setting) {
      setting = await RoundingSetting.create({}); // default value
    }
    setNoCache(res);
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update rounding setting
exports.updateRoundingSetting = async (req, res) => {
  try {
    const { roundingType } = req.body;
    let setting = await RoundingSetting.findOne();

    if (!setting) {
      // No existing setting, create new
      setting = await RoundingSetting.create({ roundingType });

      // Activity Tracker for creation
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_roundingAmount,
        modelAffected: [MODEL_AFFECTED.model_roundingSetting],
        eventType: ROUNDING_SETTING_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: setting.toObject(),
        description: `Rounding setting created by ${getFullName(req.admin.employeeInfo)}`
      });
    } else {
      // Existing setting
      const oldObj = setting.toObject();
      setting.roundingType = roundingType;
      await setting.save();
      const newObj = setting.toObject();

      // Activity Tracker
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_roundingAmount,
        modelAffected: [MODEL_AFFECTED.model_roundingSetting],
        eventType: ROUNDING_SETTING_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldObj,
        newData: newObj,
        description: `Rounding setting updated by ${getFullName(req.admin.employeeInfo)}`
      });
    }

    setNoCache(res);
    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};