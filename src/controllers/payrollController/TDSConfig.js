const TDSConfig = require("../../models/parollModels/TDSConfig");

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
      cfg = await TDSConfig.create(req.body);
    } else {
      if (req.body.tdsCalc) cfg.tdsCalc = req.body.tdsCalc;
      if (req.body.taxPref) cfg.taxPref = req.body.taxPref;
      await cfg.save();
    }
    setNoCache(res);
    res.json(cfg);
  } catch (err) {
    console.error("PUT error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
