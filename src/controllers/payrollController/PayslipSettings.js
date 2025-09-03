const PayslipSettings = require("../../models/parollModels/PayslipSettings");


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

    for (const key of allowed) {
      if (payload[key] !== undefined) update[key] = payload[key];
    }

    let settings = await PayslipSettings.findOne();
    if (!settings) {
      settings = await PayslipSettings.create(update);
    } else {
      Object.assign(settings, update);
      await settings.save();
    }
    setNoCache(res);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};
