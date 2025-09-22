const authService = require('@/services/authService');
const { ROLE_TYPES } = require('@/config/user.config');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_LOGGED_IN } = require("@/config/activity.enums");

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  try {
    // Check if databasePassword exists
    if (!databasePassword) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Password record not found. Please contact your administrator.',
      });
    }

    // Validate password using new standardized method
    const isMatch = await databasePassword.validPassword(password);

    if (!isMatch) {
      // Return invalid credentials error
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Invalid credentials.',
      });
    }

    // Check if user is admin/owner and email is not verified
    if (
      (user.role === ROLE_TYPES.OWNER || user.role === ROLE_TYPES.ADMIN) &&
      !databasePassword.emailVerified
    ) {
      return res.status(403).json({
        success: false,
        result: null,
        message:
          'Please verify your email before logging in. Check your inbox for verification link.',
      });
    }

    // Create new session with tokens
    const tokens = await authService.createSession(user, databasePassword, req);

    // Set secure cookies
    res
      .cookie('token', tokens.accessToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

        // Activity Tracker logging
    activityTracker({
      userId: user._id, // admin ka Mongo ID as userId
      companyId: user.companyId,
      plantId: user.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_authUser,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_LOGGED_IN,
      actionDone: ACTIONS.update,
      oldData: { jwtTokenIssuedAt: databasePassword.lastActivity || null },
      newData: { jwtTokenIssuedAt: new Date() }
    });
    
    res.status(200).json({
      success: true,
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
      message: 'Successfully logged in',
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(403).json({
      success: false,
      result: null,
      message: error.message || 'Authentication failed',
    });
  }
};

module.exports = authUser;