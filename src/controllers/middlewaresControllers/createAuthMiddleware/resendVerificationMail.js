const mongoose = require('mongoose');
const sendEmail = require('@/utils/emailSender');
const { emailVerfication } = require('@/emailTemplate/emailVerfication');
const checkAndCorrectURL = require('./checkAndCorrectURL');
const { useAppSettings } = require('@/settings');
const {
  BAD_REQUEST,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
  OK,
  CONFLICT,
  TOO_MANY_REQUESTS,
} = require('@/config/httpStatus.config');
const { EMAIL_TOKEN_EXPIRY } = require('@/config/token.config');
const { logWithTime } = require('@/utils/time-stamps');
const { errorMessage } = require('@/config/error-handler.config');
const { generateNanoId } = require('@/utils/idGenerator');

const resendVerificationEmail = async (req, res, { userModel }) => {
  try {
    const Admin = mongoose.model(userModel);
    const AdminPassword = mongoose.model(userModel + 'Password');

    // ✅ 0. Handle completely missing or empty request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(BAD_REQUEST).json({ success: false, message: 'Please provide Email id.' });
    }

    const { email } = req.body;

    // ✅ 1. Validate email field
    if (!email) {
      return res.status(BAD_REQUEST).json({ success: false, message: 'Email is required.' });
    }

    // ✅ 2. Find user by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(NOT_FOUND).json({ success: false, message: 'Account not found.' });
    }

    // ✅ 3. Find corresponding password document (contains token & email verification status)
    const adminPassword = await AdminPassword.findOne({ user: admin._id });
    if (!adminPassword) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, message: 'Password record missing for this account.' });
    }

    // ✅ 4. Check if email is already verified
    if (adminPassword.emailVerified) {
      return res
        .status(CONFLICT)
        .json({ success: false, message: 'This email is already verified.' });
    }

    // ✅ 5. Check if old verification token exists & not expired
    if (
      adminPassword.emailToken &&
      adminPassword.emailToken.token &&
      adminPassword.emailToken.created
    ) {
      const now = new Date();
      const expiryTime =
        new Date(adminPassword.emailToken.created).getTime() + parseInt(EMAIL_TOKEN_EXPIRY);

      if (now.getTime() < expiryTime) {
        const remainingTime = expiryTime - now.getTime();
        const remainingMinutes = Math.max(1, Math.ceil(remainingTime / 60000)); // Ensure at least 1 minute
        return res.status(TOO_MANY_REQUESTS).json({
          success: false,
          message: `A verification link has already been sent. Please try again after ${remainingMinutes} minute(s).`,
        });
      }
    }

    // ✅ 6. Generate a new email verification token
    const newToken = await generateNanoId();

    adminPassword.emailToken = {
      token: newToken,
      created: new Date(),
    };
    await adminPassword.save();

    // ✅ 7. Build the new verification link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${admin._id}/${newToken}`;

    // ✅ 8. Send the verification email
    const emailHtml = emailVerfication({
      title: 'Resend: Verify your email',
      name: admin.name,
      link: verificationLink,
      emailToken: newToken,
    });

    const emailSent = await sendEmail(email, 'Resend: Verify your email | ERPICA', emailHtml);

    // ✅ 9. Handle email sending failure
    if (!emailSent) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          'Account exists, but we could not send the verification email. Please try again later.',
      });
    }

    logWithTime(`✅ Link for email verification is resent successfully`);

    // ✅ 10. All good – send success response
    res.status(OK).json({
      success: true,
      message: 'A new verification email has been sent to your inbox.',
    });
  } catch (error) {
    logWithTime('❌ Internal Error: Failed to resend link for email verification 🗑️');
    errorMessage(error);
    // ✅ 11. Catch unexpected server errors
    res.status(INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = resendVerificationEmail;
