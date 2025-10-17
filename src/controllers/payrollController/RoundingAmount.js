const RoundingSetting = require("../../models/parollModels/RoundingAmount");

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

// Update setting
exports.updateRoundingSetting = async (req, res) => {
  try {
    const { roundingType } = req.body;
    let setting = await RoundingSetting.findOne();
    if (!setting) {
      setting = await RoundingSetting.create({ roundingType });
    } else {
      setting.roundingType = roundingType;
      await setting.save();
    }
    setNoCache(res);
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
