// token-decoder.utils.js
const jwt = require('jsonwebtoken');
const { logWithTime } = require('./time-stamps');
const { errorMessage } = require('@/config/error-handler.config');

/**
 * Decode JWT without verifying the signature
 */
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      logWithTime('❌ Failed to decode token. Invalid format.');
      return null;
    }
    logWithTime(
      `🔍 Token decoded successfully. Category: ${decoded.payload.exp ? 'Has Expiry' : 'No Expiry'}`
    );
    return decoded; // { header, payload, signature }
  } catch (err) {
    logWithTime('❌ Error occurred while decoding token.');
    errorMessage(err);
    return null;
  }
};

/**
 * Extract mongoId (`id`) from token payload
 */
const extractMongoIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.payload?.id || null;
};

module.exports = {
  extractMongoIdFromToken,
};
