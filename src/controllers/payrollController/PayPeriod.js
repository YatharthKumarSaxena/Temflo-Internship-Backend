const PayPeriod = require("../../models/parollModels/PayPeriod");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PAY_PERIOD_CREATED, PAY_PERIOD_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// Get latest settings
exports.getPayPeriod = async (req, res) => {
  try {
    let settings = await PayPeriod.findOne().sort({ updatedAt: -1 });
    if (!settings) {
      settings = await PayPeriod.create({});
    }
    setNoCache(res);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings
exports.updatePayPeriod = async (req, res) => {
  try {
    let settings = await PayPeriod.findOne();
    const oldData = settings ? settings.toObject() : null;

    if (!settings) {
      settings = new PayPeriod(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    setNoCache(res);
    await settings.save();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_payPeriod,
      modelAffected: [MODEL_AFFECTED.model_payPeriod],
      eventType: oldData ? PAY_PERIOD_UPDATED : PAY_PERIOD_CREATED,
      actionDone: oldData ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: settings.toObject(),
      description: `${oldData ? 'Pay period settings updated' : 'Pay period settings created'} by ${getFullName(req.admin.employeeInfo)}`
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};