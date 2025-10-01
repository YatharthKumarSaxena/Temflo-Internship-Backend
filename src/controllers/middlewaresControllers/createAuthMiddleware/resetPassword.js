const mongoose = require('mongoose');
const Joi = require('joi');
const shortid = require('shortid');
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PASSWORD_RESET, USER_LOGGED_OUT } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { RESET_TOKEN_EXPIRY } = require("@/config/token.config");
const { getFullName } = require("@/utils/commonFunctions");

const resetPassword = async (req, res, { userModel }) => {
  try {
    const User = mongoose.model(userModel);
    const UserPassword = mongoose.model(userModel + 'Password');

    const { password, userId, resetToken } = req.body;

    // Input validation
    const schema = Joi.object({
      password: Joi.string().min(8).required(),
      userId: Joi.string().required(),
      resetToken: Joi.string().required(),
    });
    const { error } = schema.validate({ password, userId, resetToken });
    if (error) return res.status(409).json({ success: false, message: error.message });

    // Fetch user and password record
    const user = await User.findOne({ _id: userId, removed: false });
    const userPassword = await UserPassword.findOne({ user: userId, removed: false });

    if (!user || !userPassword) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Token validation
    if (!userPassword.resetToken || resetToken !== userPassword.resetToken.token) {
      return res.status(403).json({ success: false, message: "Invalid reset token" });
    }

    // Check token expiry
    const tokenCreated = new Date(userPassword.resetToken.created).getTime();
    const now = Date.now();
    if (now > tokenCreated + RESET_TOKEN_EXPIRY) {
      return res.status(403).json({ success: false, message: "Reset token expired" });
    }

    // Generate new password hash
    const salt = shortid.generate();
    const hashedPassword = await userPassword.generateHash(salt, password);

    // Update password and reset token
    userPassword.password = hashedPassword;
    userPassword.salt = salt;
    userPassword.resetToken = null;

    // Check if there are any active refresh tokens
    const oldTokens = userPassword.activeSessions.map(s => s.refreshToken) || [];
    const hasActiveRefreshToken = oldTokens.some(token => token);

    if (hasActiveRefreshToken) {
      // Remove all active sessions
      userPassword.activeSessions = [];
    }

    // Save updates (password + sessions cleared if any)
    await userPassword.save();

    // Activity Tracker: Password reset
    activityTracker({
      userId: user._id,
      companyId: user.companyId,
      plantId: user.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_resetPassword,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_PASSWORD_RESET,
      actionDone: ACTIONS.update,
      description: `${getFullName(user.employeeInfo)} reset their password`,
      oldData: { resetToken: "Old Token", passwordChanged: false, sessionsCleared: false },
      newData: { resetToken: null, passwordChanged: true, sessionsCleared: hasActiveRefreshToken },
    });

    // If sessions were cleared, log USER_LOGGED_OUT + clear cookies
    if (hasActiveRefreshToken) {
      activityTracker({
        userId: user._id,
        companyId: user.companyId,
        plantId: user.plantId || null,
        module: MODULE.middlewares,
        subModuleAffected: SUBMODULE.createAuth,
        fileAffected: FILE.file_createAuth_resetPassword,
        modelAffected: [MODEL_AFFECTED.model_userPassword],
        eventType: USER_LOGGED_OUT,
        description: `${getFullName(user.employeeInfo)} was logged out from all devices after password reset`,
        actionDone: ACTIONS.update,
        oldData: { refreshToken: oldTokens },
        newData: { refreshToken: [] },
      });

      res
        .clearCookie('token', { path: '/', httpOnly: true })
        .clearCookie('refreshToken', { path: '/', httpOnly: true });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = resetPassword;