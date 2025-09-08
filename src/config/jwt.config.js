// Support both legacy and new env variable names and accept string durations (e.g., "1d")
const accessTokenSecretCode = process.env.ACCESS_TOKEN_SECRET_CODE || process.env.JWT_SECRET || '';

const refreshTokenSecretCode =
  process.env.REFRESH_TOKEN_SECRET_CODE || process.env.JWT_REFRESH_SECRET || '';

// jsonwebtoken supports string or numeric values for expiresIn. Prefer strings when provided.
const accessTokenExpirySeconds =
  process.env.ACCESS_TOKEN_EXPIRY || process.env.JWT_ACCESS_TOKEN_EXPIRY || '1d';

const refreshTokenExpirySeconds =
  process.env.REFRESH_TOKEN_EXPIRY || process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

module.exports = {
  accessTokenSecretCode,
  refreshTokenSecretCode,
  accessTokenExpirySeconds,
  refreshTokenExpirySeconds,
};
