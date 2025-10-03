const mongoose = require('mongoose');
const Joi = require('joi');
const { EMAIL_TOKEN_EXPIRY } = require('@/config/token.config');
const { BAD_REQUEST, OK } = require('@/config/httpStatus.config');
const { USER_LOGGED_IN, VERIFY_EMAIL } = require('@/config/activity.enums');
const {
  errorMessage,
  throwInternalServerError,
  throwConflictError,
  throwBadRequestError,
  throwInvalidResourceError,
  throwDBResourceNotFoundError,
} = require('@/config/error-handler.config');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const authService = require('@/services/authService'); // ✅ use centralized session service
const { getFullName } = require("@/utils/commonFunctions");

const verifyEmail = async (req, res, { userModel }) => {
  try {
    const User = mongoose.model(userModel);
    const UserPassword = mongoose.model(userModel + 'Password');

    if (!req.body || Object.keys(req.body).length === 0) {
      return throwBadRequestError(res, 'Request body is missing. Please provide userId and emailToken.');
    }

    const { userId, emailToken } = req.body;

    const schema = Joi.object({
      userId: Joi.string().required(),
      emailToken: Joi.string().required(),
    });

    const { error } = schema.validate({ userId, emailToken });
    if (error) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Missing or invalid fields.',
        errorMessage: error.message,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return throwInvalidResourceError(res, 'User ID format.');
    }

    const user = await User.findOne({ _id: userId, removed: false }).exec();
    const databasePassword = await UserPassword.findOne({ user: userId, removed: false }).exec();

    if (!user || !databasePassword) {
      return throwDBResourceNotFoundError(res, 'Account with this email.');
    }

    if (databasePassword.emailVerified) {
      return throwConflictError(res, 'Email already verified. Please login.');
    }

    if (!databasePassword.emailToken) {
      return throwInvalidResourceError(
        res,
        'Verification link. Link has expired. Please request a new verification email.'
      );
    }

    if (databasePassword.emailToken.token !== emailToken) {
      return throwInvalidResourceError(res, 'Verification link');
    }

    const now = new Date();
    const expiryTime =
      new Date(databasePassword.emailToken.created).getTime() + parseInt(EMAIL_TOKEN_EXPIRY);

    if (now.getTime() > expiryTime) {
      return throwInvalidResourceError(
        res,
        'Verification link. Link has expired. Please request a new verification email.'
      );
    }

    // ✅ Update user email verification
    await UserPassword.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          emailVerified: true,
          emailToken: null,
        },
      },
      { new: true }
    );

    // Activity tracker for verification
    activityTracker({
      userId: user._id,
      companyId: user.companyId,
      plantId: user.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_verifyEmail,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: VERIFY_EMAIL,
      actionDone: ACTIONS.update,
      description: `${getFullName(user.employeeInfo)} verified email (${user.email}) successfully`,
      oldData: { emailToken: 'An Email Token', emailVerified: false },
      newData: { emailToken: null, emailVerified: true },
    });

    // ✅ Now create full session like authUser
    const tokens = await authService.createSession(user, databasePassword, req);

    // Set cookies
    res
      .cookie('token', tokens.accessToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    // Activity tracker for login
    activityTracker({
      userId: user._id,
      companyId: user.companyId,
      plantId: user.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_verifyEmail,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_LOGGED_IN,
      description: `${getFullName(user.employeeInfo)} logged in after email verification`,
      actionDone: ACTIONS.update,
      oldData: { jwtTokenIssuedAt: databasePassword.lastActivity || null },
      newData: { jwtTokenIssuedAt: new Date() },
    });

    return res.status(OK).json({
      success: true,
      message: 'Email verified successfully. You are now logged in.',
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
        permissions: user.permissions,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.accessExpiresAt,
      },
    });
  } catch (error) {
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = verifyEmail;