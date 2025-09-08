const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authService = require('@/services/authService');

// JWT security configuration
const jwtSecurityConfig = {
  // Token expiration times
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1d',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',

  // Algorithm
  algorithm: process.env.JWT_ALGORITHM || 'HS256',

  // Issuer and audience for additional security
  issuer: process.env.JWT_ISSUER || 'erp-system',
  audience: process.env.JWT_AUDIENCE || 'erp-users',
};

// Enhanced JWT verification middleware with blacklist checking
const enhancedJwtVerification = (userModel = 'User') => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access denied',
          message: 'No token provided',
          jwtExpired: true,
        });
      }

      // Verify token using auth service
      const decoded = await authService.verifyToken(token, 'access');

      // Get user and password data to check blacklist
      const UserPassword = mongoose.model(userModel + 'Password');
      const User = mongoose.model(userModel);

      const [user, userPassword] = await Promise.all([
        User.findById(decoded.id),
        UserPassword.findOne({ user: decoded.id }),
      ]);

      if (!user || user.removed) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User account does not exist or has been disabled',
          jwtExpired: true,
        });
      }

      if (!userPassword) {
        return res.status(401).json({
          success: false,
          error: 'Authentication data not found',
          message: 'Please login again',
          jwtExpired: true,
        });
      }

      // Check if token is blacklisted
      if (userPassword.isTokenBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          error: 'Token revoked',
          message: 'This token has been revoked. Please login again',
          jwtExpired: true,
        });
      }

      // Check token version
      if (decoded.tokenVersion !== userPassword.tokenVersion) {
        return res.status(401).json({
          success: false,
          error: 'Token version mismatch',
          message: 'Please login again',
          jwtExpired: true,
        });
      }

      // Find and update session last activity
      const session = userPassword.activeSessions.find((s) => s.accessToken === token);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Session not found',
          message: 'Session has expired. Please login again',
          jwtExpired: true,
        });
      }

      // Update last activity
      session.lastActivity = new Date();
      await userPassword.save();

      // Add user data to request
      req.user = decoded;
      req.admin = user; // For backward compatibility
      req.session = session;

      // Add security headers
      res.setHeader('X-JWT-Issued-At', decoded.iat);
      res.setHeader('X-JWT-Expires-At', decoded.exp);
      res.setHeader('X-Token-Version', decoded.tokenVersion);

      next();
    } catch (error) {
      console.error('JWT verification error:', error);

      let errorResponse = {
        success: false,
        jwtExpired: true,
      };

      if (error.message.includes('expired')) {
        errorResponse.error = 'Token expired';
        errorResponse.message = 'Your session has expired. Please login again';
      } else if (error.message.includes('invalid') || error.message.includes('malformed')) {
        errorResponse.error = 'Invalid token';
        errorResponse.message = 'Please provide a valid authentication token';
      } else if (error.message.includes('verification failed')) {
        errorResponse.error = 'Token verification failed';
        errorResponse.message = 'Authentication failed. Please login again';
      } else {
        errorResponse.error = 'Authentication error';
        errorResponse.message = 'Authentication failed. Please try again';
      }

      return res.status(401).json(errorResponse);
    }
  };
};

// Backward compatibility for existing isValidAuthToken
const createIsValidAuthToken = (userModel = 'User') => {
  return enhancedJwtVerification(userModel);
};

module.exports = {
  enhancedJwtVerification,
  createIsValidAuthToken,
  jwtSecurityConfig,
};
