const { enhancedJwtVerification } = require('@/middlewares/jwtSecurity');

const isValidAuthToken = (req, res, next, { userModel, jwtSecret = 'JWT_SECRET' }) => {
  // Use the new enhanced JWT verification middleware
  return enhancedJwtVerification(userModel)(req, res, next);
};

module.exports = isValidAuthToken;
