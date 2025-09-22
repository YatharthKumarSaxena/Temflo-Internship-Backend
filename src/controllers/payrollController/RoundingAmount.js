const RoundingSetting = require("../../models/parollModels/RoundingAmount");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { ROUNDING_SETTING_UPDATED } = require("@/config/activity.enums");

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
        eventType: ROUNDING_SETTING_UPDATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: { roundingType }
      });
    } else {
      // Existing setting
      const oldObj = setting.toObject();
      setting.roundingType = roundingType;
      await setting.save();
      const newObj = setting.toObject();

      // 🔹 Extract only changed fields
      const oldData = {};
      const newData = {};
      if (oldObj.roundingType !== newObj.roundingType) {
        oldData.roundingType = oldObj.roundingType;
        newData.roundingType = newObj.roundingType;
      }

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
        oldData,
        newData
      });
    }

    setNoCache(res);
    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};