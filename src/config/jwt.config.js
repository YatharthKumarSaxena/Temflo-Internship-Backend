module.exports = {
  accessTokenSecretCode: process.env.ACCESS_TOKEN_SECRET_CODE,
  refreshTokenSecretCode: process.env.REFRESH_TOKEN_SECRET_CODE,
  accessTokenExpirySeconds: Number(process.env.ACCESS_TOKEN_EXPIRY),
  refreshTokenExpirySeconds: Number(process.env.REFRESH_TOKEN_EXPIRY),
};
