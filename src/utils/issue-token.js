// Extract the required Module
const jwt = require('jsonwebtoken');
const {
  accessTokenSecretCode,
  refreshTokenSecretCode,
  refreshTokenExpirySeconds,
} = require('@/config/jwt.config');
const { logWithTime } = require('./time-stamps');
const { errorMessage, throwInternalServerError } = require('@/config/error-handler.config');

const getTokenCategory = (expiryTimeOfToken) => {
  return expiryTimeOfToken === refreshTokenExpirySeconds ? 'REFRESH_TOKEN' : 'ACCESS_TOKEN';
};

const makeTokenWithMongoID = async (mongoId, res, expiryTimeOfToken) => {
  try {
    const secretCode =
      expiryTimeOfToken === refreshTokenExpirySeconds
        ? refreshTokenSecretCode
        : accessTokenSecretCode;
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
    throwInternalServerError(res);
    return null;
  }
};

module.exports = {
  makeTokenWithMongoID,
};
