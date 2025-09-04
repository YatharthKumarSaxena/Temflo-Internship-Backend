// Extract the required Module
const jwt = require('jsonwebtoken');
const {
  accessTokenSecretCode,
  refreshTokenSecretCode,
  refreshTokenExpirySeconds,
} = require('@/config/jwt.config');
const { logWithTime } = require('./time-stamps');
const { errorMessage } = require('@/config/error-handler.config');

const getTokenCategory = (expiryTimeOfToken) => {
  return expiryTimeOfToken === refreshTokenExpirySeconds ? 'REFRESH_TOKEN' : 'ACCESS_TOKEN';
};

const makeTokenWithMongoID = async (mongoId, res, expiryTimeOfToken) => {
  try {
    const secretCode =
      expiryTimeOfToken === refreshTokenExpirySeconds
        ? refreshTokenSecretCode
        : accessTokenSecretCode;

    if (!secretCode) {
      const missing = [];
      if (!accessTokenSecretCode) missing.push('ACCESS_TOKEN_SECRET_CODE or JWT_SECRET');
      if (!refreshTokenSecretCode) missing.push('REFRESH_TOKEN_SECRET_CODE or JWT_REFRESH_SECRET');
      const message = `JWT secret is missing. Set ${missing.join(' and ')}`;
      throw new Error(message);
    }
    const newToken = jwt.sign(
      {
        id: mongoId, // ✅ required for `findById`
      },
      secretCode,
      { expiresIn: expiryTimeOfToken }
    );
    const tokenCategory = getTokenCategory(expiryTimeOfToken);
    logWithTime(`✅ (${tokenCategory}) successfully created for user: ${mongoId}.`);
    return newToken;
  } catch (err) {
    logWithTime('`❌ An Internal Error Occurred while creating the token');
    errorMessage(err);
    // Don't send response here, let the calling function handle it
    throw err;
  }
};

module.exports = {
  makeTokenWithMongoID,
};
