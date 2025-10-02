const authService = require('@/services/authService');
const { USER_LOGGED_OUT } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const logout = async (req, res, { userModel }) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    const logoutAll = req.body?.logoutAll === true;

    if (token) {
      // Use auth service to handle logout and token blacklisting
      await authService.logout(token, userModel, logoutAll);
    }

    // Clear cookies
    res
      .clearCookie('token', {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
      })
      .clearCookie('refreshToken', {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
      });

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_logout,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_LOGGED_OUT,
      actionDone: ACTIONS.update,
      description: `${getFullName(req.admin.employeeInfo)} logged out${logoutAll ? " from all devices" : ""}`,
      oldData: {
        refreshToken: "A Refresh Token"
      },  
      newData: {
        refreshToken: null
      }   
    });

    res.status(200).json({
      success: true,
      result: {},
      message: logoutAll ? 'Successfully logged out from all devices' : 'Successfully logged out',
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Still clear cookies even if logout fails
    res
      .clearCookie('token', {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
      })
      .clearCookie('refreshToken', {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        // Remove domain restriction for cross-origin cookie access
        // domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
      });

    res.status(200).json({
      success: true,
      result: {},
      message: 'Logged out (with errors)',
    });
  }
};

module.exports = logout;