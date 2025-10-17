import AdvanceLoan from "../../models/parollModels/AdvanceLoan.js";

// Middleware helper to set no-cache
const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};
// Create Advance/Loan
export const createAdvanceLoan = async (req, res) => {
  try {
    const loan = await AdvanceLoan.create(req.body);
    setNoCache(res);
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all Advances/Loans (with employee + batch populated)
export const getAdvanceLoans = async (req, res) => {
  try {
    const loans = await AdvanceLoan.find()
      .populate("employee", "name email") // adjust fields
      .populate("batch", "name period"); // adjust fields
    setNoCache(res);
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get by ID
export const getAdvanceLoanById = async (req, res) => {
  try {
    const loan = await AdvanceLoan.findById(req.params.id)
      .populate("employee", "name email")
      .populate("batch", "name period");

    if (!loan) return res.status(404).json({ error: "Not found" });
    setNoCache(res);
    res.json(loan);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
export const updateAdvanceLoan = async (req, res) => {
  try {
    const loan = await AdvanceLoan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!loan) return res.status(404).json({ error: "Not found" });
    setNoCache(res);
    res.json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
export const deleteAdvanceLoan = async (req, res) => {
  try {
    const loan = await AdvanceLoan.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ error: "Not found" });
    setNoCache(res);
    res.json({ message: "Advance/Loan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
