const rateLimit = require('express-rate-limit');

// Simple rate limiting: 200 requests per minute
const simpleRateLimit = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 1) * 60 * 1000, // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200, // 200 requests default
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: parseInt(process.env.RATE_LIMIT_WINDOW) || 1, // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  },
});

module.exports = {
  simpleRateLimit,
};
