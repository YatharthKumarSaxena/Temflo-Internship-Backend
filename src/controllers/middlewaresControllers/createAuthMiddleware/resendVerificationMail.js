const mongoose = require('mongoose');
const { sendEmail } = require('@/utils/emailSender');
const { emailVerfication } = require('@/emailTemplate/emailVerfication');
const { useAppSettings } = require('@/settings');
const { logWithTime } = require('@/utils/time-stamps');
const { generateNanoId } = require('@/utils/idGenerator');
const {
  errorMessage,
  throwInternalServerError,
  throwConflictError,
  throwMissingFieldsError,
  throwNotFoundError,
} = require('@/config/error-handler.config');
const {
  OK,
  TOO_MANY_REQUESTS,
} = require('@/config/httpStatus.config');;

const resendVerificationEmail = async (req, res, { userModel }) => {
  try {
    const User = mongoose.model(userModel);
    const UserPassword = mongoose.model(userModel + 'Password');

    if (!req.body || !req.body.email) {
      return throwMissingFieldsError(res, 'Email is required.');
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return throwNotFoundError(res, 'Account not found.');
    }

    // Find password record
    const userPassword = await UserPassword.findOne({ user: user._id });
    if (!userPassword) {
      return throwNotFoundError(res, 'Password record missing for this account.');
    }

    // Already verified?
    if (userPassword.emailVerified) {
      return throwConflictError(res, 'This email is already verified.');
    }

    const now = new Date();

    // Check if token already exists and not expired
    if (userPassword.emailToken && userPassword.emailToken.token && userPassword.emailToken.created) {
      const expiryTime = new Date(userPassword.emailToken.created).getTime() + parseInt(process.env.EMAIL_TOKEN_EXPIRY);
      if (now.getTime() < expiryTime) {
        const remainingMinutes = Math.max(1, Math.ceil((expiryTime - now.getTime()) / 60000));
        return res.status(TOO_MANY_REQUESTS).json({
          success: false,
          message: `A verification link has already been sent. Please try again after ${remainingMinutes} minute(s).`,
        });
      }
    }

    // Generate new token
    const newToken = await generateNanoId();
    userPassword.emailToken = { token: newToken, created: now };
    await userPassword.save();

    // Build verification link
    const settings = useAppSettings();
    const baseUrl = settings['frontend_url'] || process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${user._id}/${newToken}`;

    // Send email
    const emailHtml = emailVerfication({
      title: 'Resend: Verify your email',
      name: user.name,
      link: verificationLink,
      emailToken: newToken,
    });

    const emailSent = await sendEmail(email, 'Resend: Verify your email | ERPICA', emailHtml);

    if (!emailSent) {
      return throwInternalServerError(res);
    }

    res.status(OK).json({
      success: true,
      message: 'A new verification email has been sent to your inbox.',
    });
  } catch (error) {
    logWithTime('❌ Error in resendVerificationEmail');
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = resendVerificationEmail;