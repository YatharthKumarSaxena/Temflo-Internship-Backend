const PayPeriod = require("../../models/parollModels/PayPeriod");

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
    if (!settings) {
      settings = new PayPeriod(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    setNoCache(res);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
