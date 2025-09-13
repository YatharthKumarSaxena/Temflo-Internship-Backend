const Joi = require('joi');
const mongoose = require('mongoose');
const checkAndCorrectURL = require('./checkAndCorrectURL');
const { sendEmail } = require('@/utils/emailSender');
const shortid = require('shortid');
const { useAppSettings } = require('@/settings');
const { RESET_TOKEN_EXPIRY } = require('@/config/token.config'); // in milliseconds
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");

const forgetPassword = async (req, res, { userModel }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');
    const User = mongoose.model(userModel);
    const { email } = req.body;

    // Validate email
    const schema = Joi.object({
      email: Joi.string().email({ tlds: { allow: true } }).required(),
    });
    const { error } = schema.validate({ email });
    if (error) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Invalid email.',
        errorMessage: error.message,
      });
    }

    // Find user
    const user = await User.findOne({ email, removed: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive, contact your administrator',
      });
    }

    // Find user's password record
    const userPassword = await UserPassword.findOne({ user: user._id, removed: false });
    const now = new Date();

    // Check if valid token exists and not expired
    if (
      userPassword.resetToken &&
      userPassword.resetToken.token &&
      userPassword.resetToken.created
    ) {
      const tokenCreated = new Date(userPassword.resetToken.created).getTime();
      const tokenExpiryTime = tokenCreated + RESET_TOKEN_EXPIRY;

if (now.getTime() < tokenExpiryTime) {
    const remainingMs = tokenExpiryTime - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000); // minutes
    return res.status(409).json({
        success: false,
        message: `Password reset email already sent. Please check your inbox. Token will expire in ${remainingMinutes} minute(s).`,
    });
}

    }

    // Generate new token if none exists or expired
    const resetToken = shortid.generate();
    userPassword.resetToken = { token: resetToken, created: now };
    await userPassword.save();

    // Build reset link
    const settings = useAppSettings();
    const idurar_base_url = settings['idurar_base_url'];
    const url = checkAndCorrectURL(idurar_base_url);
    const resetLink = `${url}/resetpassword/${user._id}/${resetToken}`;

    // Use master template
    const config = {
      ...masterTemplate.resetPassword, // predefined config
      user_name: user.name || "User",
      actionlink: resetLink,
      action_link: resetLink,
    };
    const html = generateMasterTemplate(config);

    // Send email
    const emailSent = await sendEmail(
      email,
      config.subject || "Reset your password",
      html
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Sorry, an internal error occurred. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Check your email inbox to reset your password',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = forgetPassword;