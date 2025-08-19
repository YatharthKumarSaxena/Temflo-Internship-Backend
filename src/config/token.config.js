module.exports = {
  EMAIL_TOKEN_EXPIRY: process.env.EMAIL_TOKEN_EXPIRY || 30 * 60 * 1000, // 30 min
  RESET_TOKEN_EXPIRY: process.env.RESET_TOKEN_EXPIRY || 30 * 60 * 1000, // 30 min
};
