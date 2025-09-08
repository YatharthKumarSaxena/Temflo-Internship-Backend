const Allowance = require('../../models/parollModels/Allowance');

// Middleware helper to set no-cache
const setNoCache = (res) => {
  res.set('Cache-Control', 'no-store');
};

// Create Allowance
const createAllowance = async (req, res) => {
  try {
    const allowance = new Allowance(req.body);
    await allowance.save();

    setNoCache(res);
    res.status(201).json({
      success: true,
      message: 'Allowance created successfully',
      allowance,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get All Allowances
const getAllowances = async (req, res) => {
  try {
    const allowances = await Allowance.find();
    setNoCache(res);

    res.status(200).json({ success: true, data: allowances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Allowance by ID
const getAllowanceById = async (req, res) => {
  try {
    const allowance = await Allowance.findById(req.params.id);
    setNoCache(res);

    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }
    res.status(200).json({ success: true, data: allowance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Allowance
const updateAllowance = async (req, res) => {
  try {
    const allowance = await Allowance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    setNoCache(res);

    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Allowance updated successfully',
      allowance,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete Allowance
const deleteAllowance = async (req, res) => {
  try {
    const allowance = await Allowance.findByIdAndDelete(req.params.id);
    setNoCache(res);

    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Allowance deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export all handlers (CommonJS style)
module.exports = {
  createAllowance,
  getAllowances,
  getAllowanceById,
  updateAllowance,
  deleteAllowance,
};
