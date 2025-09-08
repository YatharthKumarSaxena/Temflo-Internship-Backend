const { httpOnly, secure, sameSite } = require('@/config/cookie.config');
const { errorMessage, throwInternalServerError } = require('@/config/error-handler.config');
const { refreshTokenExpirySeconds } = require('@/config/jwt.config');
const { logWithTime } = require('./time-stamps');

// utils/cookie-manager.utils.js

// Helper function to convert duration string to milliseconds
const convertDurationToMs = (duration) => {
  if (typeof duration === 'number') {
    return duration * 1000;
  }

  if (typeof duration === 'string') {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
};

const setRefreshTokenCookie = (res, token) => {
  try {
    const maxAgeMs = convertDurationToMs(refreshTokenExpirySeconds);

    res.cookie('refreshToken', token, {
      httpOnly: httpOnly,
      sameSite: sameSite,
      secure: secure,
      maxAge: maxAgeMs, // Expiry Time in Cookie are given in MilliSeconds
    });

    return true;
  } catch (err) {
    errorMessage(err);
    // Don't call throwInternalServerError here as it sends a response
    // Let the calling function handle the error
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

    return true;
  } catch (err) {
    errorMessage(err);
    // Don't call throwInternalServerError here as it sends a response
    // Let the calling function handle the error
    return false;
  }
};

module.exports = {
  setRefreshTokenCookie: setRefreshTokenCookie,
  clearRefreshTokenCookie: clearRefreshTokenCookie,
};
