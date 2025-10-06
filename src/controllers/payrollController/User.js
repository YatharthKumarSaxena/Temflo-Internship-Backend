const User = require("../../models/userModels/User.js");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_CREATED_PAYROLL, USER_DELETED_PAYROLL, USER_UPDATED_PAYROLL } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_user,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: USER_CREATED_PAYROLL,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: saved.toObject(),
      description: `User created by ${getFullName(req.admin.employeeInfo)}`
    });

    setNoCache(res);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    setNoCache(res);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    setNoCache(res);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found" });

    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_user,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: USER_UPDATED_PAYROLL,
      actionDone: ACTIONS.update,
      oldData: existing.toObject(),
      newData: updated.toObject(),
      description: `User updated by ${getFullName(req.admin.employeeInfo)}`
    });

    setNoCache(res);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.payroll,
      subModuleAffected: null,
      fileAffected: FILE.file_user,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: USER_DELETED_PAYROLL,
      actionDone: ACTIONS.delete,
      oldData: deleted.toObject(),
      newData: null,
      description: `User deleted by ${getFullName(req.admin.employeeInfo)}`
    });

    setNoCache(res);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};