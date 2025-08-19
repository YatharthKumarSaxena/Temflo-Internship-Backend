const { logWithTime } = require('./time-stamps');
const { errorMessage, throwInternalServerError } = require('@/config/error-handler.config');

const setAccessTokenHeaders = (res, token) => {
  try {
    res.setHeader('Authorization', `Bearer ${token}`);
    res.setHeader('X-Access-Token', token);
    logWithTime(`✅ Access Token Headers Set`);
    return true;
  } catch (err) {
    logWithTime('❌ An Internal Error occurred while setting the Access Token in Headers');
    errorMessage(err);
    throwInternalServerError(res);
    return false;
  }
};

module.exports = {
  setAccessTokenHeaders,
};
