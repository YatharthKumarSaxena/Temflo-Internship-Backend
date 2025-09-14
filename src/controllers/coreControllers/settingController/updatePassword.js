const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PASSWORD_UPDATED } = require("@/config/activity.enums");

const updatePassword = async (req, res) => {
  const UserPassword = mongoose.model('UserPassword');

  const { oldPassword, password, confirmPassword } = req.body;

  if (!oldPassword || !password || !confirmPassword) {
    return res.status(400).json({ msg: 'Old password, new password, and confirm password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ msg: 'The new password must be at least 8 characters long.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'New password and confirm password do not match.' });
  }

  // Step 1: Fetch existing password entry
  const existingPasswordDoc = await UserPassword.findOne({
    user: req.admin._id,
    removed: false,
  });

  if (!existingPasswordDoc) {
    return res.status(404).json({ msg: 'Password record not found.' });
  }

  // Step 2: Validate old password
  const isOldPasswordCorrect = bcrypt.compareSync(
    existingPasswordDoc.salt + oldPassword,
    existingPasswordDoc.password
  );

  if (!isOldPasswordCorrect) {
    return res.status(401).json({ msg: 'Old password is incorrect.' });
  }

  // Step 3: Generate and update new password
  const salt = uniqueId();
  const passwordHash = bcrypt.hashSync(salt + password);

  const resultPassword = await UserPassword.findOneAndUpdate(
    { user: req.admin._id, removed: false },
    { $set: { password: passwordHash, salt } },
    { new: true }
  ).exec();

  if (!resultPassword) {
    return res.status(403).json({
      success: false,
      result: null,
      message: "User password couldn't be saved correctly.",
    });
  }

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.setting,
      fileAffected: FILE.file_setting_updatePassword,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_PASSWORD_UPDATED,
      actionDone: ACTIONS.update,
      oldData: { passwordChanged: false },
      newData: { passwordChanged: true }
    });
  return res.status(200).json({
    success: true,
    result: {},
    message: 'Password updated successfully ',
  });
};

module.exports = updatePassword;