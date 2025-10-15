const LoanRepayment = require("../../models/parollModels/LoanRepayment");

// Get all repayments
exports.getAllLoanRepayments = async (req, res) => {
  try {
    const repayments = await LoanRepayment.find();
    res.json(repayments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create repayment
exports.createLoanRepayment = async (req, res) => {
  try {
    const repayment = await LoanRepayment.create(req.body);
    res.status(201).json(repayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update repayment
exports.updateLoanRepayment = async (req, res) => {
  try {
    const updated = await LoanRepayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Loan repayment not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete repayment
exports.deleteLoanRepayment = async (req, res) => {
  try {
    const deleted = await LoanRepayment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Loan repayment not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
