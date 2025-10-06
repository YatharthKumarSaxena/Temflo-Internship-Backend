const Allowance = require('../../models/parollModels/Allowance');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { ALLOWANCE_CREATED, ALLOWANCE_UPDATED, ALLOWANCE_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

// Middleware helper to set no-cache
const setNoCache = (res) => {
  res.set('Cache-Control', 'no-store');
};

// Create Allowance
const createAllowance = async (req, res) => {
  try {
    const allowance = new Allowance(req.body);
    await allowance.save();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_allowance,
      modelAffected: [MODEL_AFFECTED.model_allowance],
      eventType: ALLOWANCE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: allowance.toObject(),
      description: `Allowance created by ${getFullName(req.admin.employeeInfo)}`
    });

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
    const oldAllowance = await Allowance.findById(req.params.id);
    if(!oldAllowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }
    const allowance = await Allowance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    setNoCache(res);

    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_allowance,
      modelAffected: [MODEL_AFFECTED.model_allowance],
      eventType: ALLOWANCE_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldAllowance ? oldAllowance.toObject() : null,
      newData: allowance.toObject(),
      description: `Allowance updated by ${getFullName(req.admin.employeeInfo)}`
    });

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

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_allowance,
      modelAffected: [MODEL_AFFECTED.model_allowance],
      eventType: ALLOWANCE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: allowance.toObject(),
      newData: null,
      description: `Allowance deleted by ${getFullName(req.admin.employeeInfo)}`
    });

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