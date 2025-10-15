const Compensation = require("../../models/parollModels/Compensation");
const UserWithBatch = require("../../models/parollModels/UserWithBatch");

// Create Compensation
const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};
exports.createCompensation = async (req, res) => {
  try {
    const {
      employeeId, gross, basic, variable, gratuity, ctc,
      paymentMethod, allowances, deductions, effectiveDate,
      statutory, statutorySettings,
    } = req.body;

    const payload = {
      employeeId,
      gross: Number(gross) || 0,
      basic: Number(basic) || 0,
      variable: Number(variable) || 0,
      gratuity: Number(gratuity) || 0,
      ctc: Number(ctc) || 0,
      paymentMethod: paymentMethod || "Cash Only",
      allowances: typeof allowances === "object" && !Array.isArray(allowances) ? allowances : {},
      deductions: typeof deductions === "object" && !Array.isArray(deductions) ? deductions : {},
      statutorySettings:
        statutory && typeof statutory === "object"
          ? statutory
          : statutorySettings && typeof statutorySettings === "object"
            ? statutorySettings
            : {},
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
    };
    
    const compensation = new Compensation(payload);
    setNoCache(res);
    await compensation.save();
    res.status(201).json({ success: true, data: compensation });
  } catch (error) {
    console.error("Create Compensation error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get Compensations
exports.getCompensations = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;

    const compensations = await Compensation.find(filter)
      .sort({ effectiveDate: -1 })
      .populate("employeeId", "name email");
setNoCache(res);
    res.status(200).json({ success: true, data: compensations });
  } catch (error) {
    console.error("Get Compensations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Employees with latest Compensation for a Batch
exports.getSalaryByBatch = async (req, res) => {
  try {
    const { batch } = req.query;
    if (!batch) {
      return res.status(400).json({ success: false, message: "Batch is required" });
    }

    const employees = await UserWithBatch.find({
      removed: false,
      enabled: true,
      status: "active",
      isBatchSelected: true,
      selectedBatch: batch,
    }).select("name role companyId status enabled removed isBatchSelected selectedBatch");

    const results = await Promise.all(
      employees.map(async (emp) => {
        const comp = await Compensation.findOne({ employeeId: emp._id })
          .sort({ effectiveDate: -1 })
          .select("gross basic allowances deductions variable gratuity paymentMethod statutorySettings");

        return { ...emp.toObject(), compensation: comp || null };
      })
    );
    setNoCache(res);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("GET /salary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Compensation by ID
exports.getCompensationById = async (req, res) => {
  try {
    const compensation = await Compensation.findById(req.params.id)
      .populate("employeeId", "name email");
    if (!compensation) {
      return res.status(404).json({ success: false, message: "Compensation not found" });
    }
    setNoCache(res);
    res.status(200).json({ success: true, data: compensation });
  } catch (error) {
    console.error("Get Compensation by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Compensation
exports.updateCompensation = async (req, res) => {
  try {
    const existing = await Compensation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Compensation not found" });
    }

    const {
      gross, basic, variable, gratuity, ctc, paymentMethod,
      allowances, deductions, effectiveDate, statutory, statutorySettings,
    } = req.body;

    const updateData = {
      gross: gross !== undefined ? Number(gross) || 0 : existing.gross,
      basic: basic !== undefined ? Number(basic) || 0 : existing.basic,
      variable: variable !== undefined ? Number(variable) || 0 : existing.variable,
      gratuity: gratuity !== undefined ? Number(gratuity) || 0 : existing.gratuity,
      ctc: ctc !== undefined ? Number(ctc) || 0 : existing.ctc,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
      allowances: allowances !== undefined
        ? (typeof allowances === "object" && !Array.isArray(allowances) ? allowances : existing.allowances)
        : existing.allowances,
      deductions: deductions !== undefined
        ? (typeof deductions === "object" && !Array.isArray(deductions) ? deductions : existing.deductions)
        : existing.deductions,
      statutorySettings:
        statutory !== undefined
          ? statutory
          : statutorySettings !== undefined
            ? statutorySettings
            : existing.statutorySettings || existing.statutory || {},
      effectiveDate: effectiveDate !== undefined ? new Date(effectiveDate) : existing.effectiveDate,
    };

    const compensation = await Compensation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    setNoCache(res);
    res.status(200).json({ success: true, data: compensation });
  } catch (error) {
    console.error("Update Compensation error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete Compensation
exports.deleteCompensation = async (req, res) => {
  try {
    const compensation = await Compensation.findByIdAndDelete(req.params.id);
    if (!compensation) {
      return res.status(404).json({ success: false, message: "Compensation not found" });
    }
    setNoCache(res);
    res.status(200).json({ success: true, message: "Compensation deleted successfully" });
  } catch (error) {
    console.error("Delete Compensation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
