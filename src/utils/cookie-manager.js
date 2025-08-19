const { httpOnly, secure, sameSite } = require('@/config/cookie.config');
const { errorMessage, throwInternalServerError } = require('@/config/error-handler.config');
const { refreshTokenExpirySeconds } = require('@/config/jwt.config');
const { logWithTime } = require('./time-stamps');

// utils/cookie-manager.utils.js

const setRefreshTokenCookie = (res, token) => {
  try {
    res.cookie('refreshToken', token, {
      httpOnly: httpOnly,
      sameSite: sameSite,
      secure: secure,
      maxAge: refreshTokenExpirySeconds * 1000, // Expiry Time in Cookie are given in MilliSeconds
    });
    logWithTime(`🍪 Refresh Token Cookie Set`);
    return true;
  } catch (err) {
    logWithTime('An Internal Error occured while setting the Refresh Token in Cookie');
    errorMessage(err);
    throwInternalServerError(res);
    return false;
  }
};

const clearRefreshTokenCookie = (res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: httpOnly,
      sameSite: sameSite,
      secure: secure,
      path: '/',
    });
    logWithTime(`🧹 Refresh Token Cookie Cleared`);
    return true;
  } catch (err) {
    logWithTime('An Internal Error occured while clearing the Refresh Token from Cookie');
    errorMessage(err);
    throwInternalServerError(res);
    return false;
  }
};

module.exports = {
  setRefreshTokenCookie: setRefreshTokenCookie,
  clearRefreshTokenCookie: clearRefreshTokenCookie,
};
