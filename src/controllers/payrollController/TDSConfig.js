const TDSConfig = require("../../models/parollModels/TDSConfig");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TDS_CONFIG_UPDATED, TDS_CONFIG_CREATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// GET TDS Config
exports.getTDSConfig = async (req, res) => {
  try {
    let cfg = await TDSConfig.findOne();
    if (!cfg) {
      cfg = await TDSConfig.create({});
    }
    setNoCache(res);
    res.json(cfg);
  } catch (err) {
    console.error("GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE TDS Config
exports.updateTDSConfig = async (req, res) => {
  try {
    let cfg = await TDSConfig.findOne();
    if (!cfg) {
      // Agar record nahi hai, create kar do
      cfg = await TDSConfig.create(req.body);

      // Activity Tracker for create
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_TDSConfig,
        modelAffected: [MODEL_AFFECTED.model_TDSConfig],
        eventType: TDS_CONFIG_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: cfg.toObject(),
        description: `TDS Config created by ${getFullName(req.admin.employeeInfo)}`
      });
    } else {
      const oldObj = cfg.toObject();
      // Update only if provided
      if (req.body.tdsCalc !== undefined) cfg.tdsCalc = req.body.tdsCalc;
      if (req.body.taxPref !== undefined) cfg.taxPref = req.body.taxPref;
      await cfg.save();

      const newObj = cfg.toObject();

      // Activity Tracker for update
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.payroll,
        subModuleAffected: null,
        fileAffected: FILE.file_TDSConfig,
        modelAffected: [MODEL_AFFECTED.model_TDSConfig],
        eventType: TDS_CONFIG_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldObj,
        newData: newObj,
        description: `TDS Config updated by ${getFullName(req.admin.employeeInfo)}`
      });
    }

    setNoCache(res);
    res.json(cfg);
  } catch (err) {
    console.error("PUT error:", err);
    res.status(500).json({ message: "Server error" });
  }
};