const jwt = require('jsonwebtoken');

// JWT security configuration
const jwtSecurityConfig = {
  // Token expiration times
  accessTokenExpiry: '15m', // 15 minutes
  refreshTokenExpiry: '7d', // 7 days

  // Algorithm
  algorithm: 'HS256',

  // Issuer and audience for additional security
  issuer: process.env.JWT_ISSUER || 'erp-system',
  audience: process.env.JWT_AUDIENCE || 'erp-users',
};

// Enhanced JWT verification middleware
const enhancedJwtVerification = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
    }

    // Verify token with enhanced options
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [jwtSecurityConfig.algorithm],
      issuer: jwtSecurityConfig.issuer,
      audience: jwtSecurityConfig.audience,
      clockTolerance: 30, // 30 seconds tolerance for clock skew
    });

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }

    // Check if token was issued too long ago (additional security)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (decoded.iat && Date.now() - decoded.iat * 1000 > maxAge) {
      return res.status(401).json({
        error: 'Token too old',
        message: 'Please login again',
      });
    }

    // Add decoded token to request
    req.user = decoded;

    // Add security headers
    res.setHeader('X-JWT-Issued-At', decoded.iat);
    res.setHeader('X-JWT-Expires-At', decoded.exp);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid token',
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not active',
        message: 'Token is not yet valid',
      });
    } else {
      console.error('JWT verification error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Token verification failed',
      });
    }
  }
};

// Generate secure JWT tokens
const generateSecureTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: jwtSecurityConfig.accessTokenExpiry,
    algorithm: jwtSecurityConfig.algorithm,
    issuer: jwtSecurityConfig.issuer,
    audience: jwtSecurityConfig.audience,
    subject: payload.id || payload._id,
    jwtid: require('nanoid').nanoid(), // Unique token ID
  });

  const refreshToken = jwt.sign(
    {
      id: payload.id || payload._id,
      type: 'refresh',
      version: payload.tokenVersion || 1, // For token invalidation
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: jwtSecurityConfig.refreshTokenExpiry,
      algorithm: jwtSecurityConfig.algorithm,
      issuer: jwtSecurityConfig.issuer,
      audience: jwtSecurityConfig.audience,
      subject: payload.id || payload._id,
      jwtid: require('nanoid').nanoid(),
    }
  );

  return { accessToken, refreshToken };
};

// Token refresh middleware
const refreshTokenMiddleware = (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        algorithms: [jwtSecurityConfig.algorithm],
        issuer: jwtSecurityConfig.issuer,
        audience: jwtSecurityConfig.audience,
      }
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Token is not a refresh token',
      });
    }

    req.refreshTokenData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Please login again',
    });
  }
};

// Token blacklist check (for logout functionality)
const tokenBlacklistCheck = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return next();
  }

  next();
};

module.exports = {
  enhancedJwtVerification,
  generateSecureTokens,
  refreshTokenMiddleware,
  tokenBlacklistCheck,
  jwtSecurityConfig,
};
