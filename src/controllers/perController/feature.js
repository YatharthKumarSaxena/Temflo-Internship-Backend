const { MODEL_AFFECTED, MODULE, ACTIONS, FILE, SUBMODULE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PERMISSION_ADDED } = require("@/config/activity.enums");

const feature = async (Model, req, res) => {
  const { features } = req.body;

  if (!Array.isArray(features)) {
    return res
      .status(400)
      .json({ success: false, message: "enter a valid features format" });
  }

  try {
    const user = await Model.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const oldPermissions = user.permissions; // 🔹 old data for logging

    user.permissions = features;
    await user.save();

    // ✅ Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.permission, 
      subModuleAffected: null, 
      fileAffected: FILE.file_permission_added, 
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: PERMISSION_ADDED,
      actionDone: ACTIONS.update,
      oldData: oldPermissions,
      newData: {
        newPermission: user.permissions,
        note: "New Permission added, rest are same as old data"
      }
    });

    res.status(200).json({
      success: true,
      message: `Permission(s) updated successfully`,
      permissions: user.permissions,
    });
  } catch (err) {
    console.error("Error adding permissions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = feature;