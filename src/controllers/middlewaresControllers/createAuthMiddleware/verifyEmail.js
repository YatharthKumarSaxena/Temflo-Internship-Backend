const mongoose = require('mongoose');
const Joi = require('joi');
const { EMAIL_TOKEN_EXPIRY } = require('@/config/token.config'); // ✅ new constant for email token expiry
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
const { logWithTime } = require('@/utils/time-stamps');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const { makeTokenWithMongoID } = require('@/utils/issue-token');
const { refreshTokenExpirySeconds, accessTokenExpirySeconds } = require('@/config/jwt.config');
const { setAccessTokenHeaders } = require('@/utils/token-headers');
const { setRefreshTokenCookie } = require('@/utils/cookie-manager');

const verifyEmail = async (req, res, { userModel }) => {
  try {
    const User = mongoose.model(userModel);
    const UserPassword = mongoose.model(userModel + 'Password');

    // ✅ 0. Handle completely missing or empty request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return throwBadRequestError(
        res,
        'Request body is missing. Please provide userId and emailToken.'
      );
    }

    const { userId, emailToken } = req.body;

    // ✅ 1. Validate input fields with Joi
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

    // ✅ 2. Check if userId is a valid Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return throwInvalidResourceError(res, 'User ID format.');
    }

    // ✅ 3. Fetch user & password document
    const user = await User.findOne({ _id: userId, removed: false }).exec();
    const databasePassword = await UserPassword.findOne({ user: userId, removed: false }).exec();

    if (!user || !databasePassword) {
      return throwDBResourceNotFoundError(res, 'Account with this email.');
    }

    // ✅ 4. Already verified?
    if (databasePassword.emailVerified) {
      return throwConflictError(res, 'Email already verified. Please login.');
    }

    // ✅ 5. Token validation
    if (!databasePassword.emailToken) {
      return throwInvalidResourceError(
        res,
        'Verification link. Link has expired. Please request a new verification email.'
      );
    }

    if (databasePassword.emailToken.token !== emailToken) {
      return throwInvalidResourceError(res, 'Verification link');
    }

    // ✅ 6. Expiry check
    const now = new Date();
    const expiryTime = new Date(databasePassword.emailToken.created).getTime() + EMAIL_TOKEN_EXPIRY;

    if (now.getTime() > expiryTime) {
      return throwInvalidResourceError(
        res,
        'Verification link. Link has expired. Please request a new verification email.'
      );
    }

    // ✅ 7. Mark email as verified & clear token
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

    logWithTime(`✅ 🎯 User Email Verified successfully 🚀`);

    // Activity Tracker logging
    await activityTracker({
      userId: user._id, // admin ka Mongo ID as userId
      companyId: user.companyId,
      plantId: null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_verifyEmail,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: VERIFY_EMAIL,
      actionDone: ACTIONS.update,
      oldData: {
        emailToken: 'An Email Token',
        emailVerified: false,
      },
      newData: {
        emailToken: null,
        emailVerified: true,
      },
    });

    const refreshToken = await makeTokenWithMongoID(user._id, res, refreshTokenExpirySeconds);

    await UserPassword.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          refreshToken: refreshToken,
          jwtTokenIssuedAt: new Date(),
        },
      },
      { new: true }
    );

    logWithTime(`✅ 🎯 User logged in successfully 🚀`);
    const isCookieSet = setRefreshTokenCookie(res, refreshToken);
    if (!isCookieSet) {
      return res.status(OK).json({
        success: true,
        message: 'Email verified successfully. Please login to continue.',
      });
    }

    // Activity Tracker logging
    await activityTracker({
      userId: user._id, // admin ka Mongo ID as userId
      companyId: user.companyId,
      plantId: null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_verifyEmail,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_LOGGED_IN,
      actionDone: ACTIONS.update,
      oldData: null, // Pending, this will be done in authentication part
      newData: null, // Pending, this will be done in authentication part
    });

    const accessToken = await makeTokenWithMongoID(user._id, res, accessTokenExpirySeconds);
    const isAccessTokenSet = setAccessTokenHeaders(res, accessToken);
    if (!isAccessTokenSet) {
      logWithTime(`Access Token is not set at Email Verification`);
    }

    return res.status(OK).json({
      success: true,
      message: 'Email verified successfully. You are now logged in.',
    });
  } catch (error) {
    logWithTime('❌ Internal Error: Failed to Verify a User 🗑️');
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = verifyEmail;
