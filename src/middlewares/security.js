const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('express-xss-sanitizer');
const securityConfig = require('../config/security.config');

// Apply Helmet security headers
const applyHelmet = helmet(securityConfig.helmet);

// General rate limiting middleware
const generalRateLimit = rateLimit(securityConfig.rateLimit);

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit(securityConfig.authRateLimit);

// MongoDB sanitization middleware
const applyMongoSanitize = mongoSanitize(securityConfig.mongoSanitize);

// XSS protection middleware
const applyXssProtection = xss.xss(securityConfig.xss);

// Additional security headers middleware
const additionalSecurityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add security timestamp
  res.setHeader('X-Security-Timestamp', Date.now());

  next();
};

// Request validation middleware (simplified - no pattern blocking)
const validateRequest = (req, res, next) => {
  // All requests pass through - no blocking
  next();
};

// File upload security middleware
const secureFileUpload = (req, res, next) => {
  // Check if file upload is present
  if (req.files) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${file.mimetype} is not allowed`,
        });
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 10MB',
        });
      }

      // Check for suspicious file extensions
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (suspiciousExtensions.includes(fileExtension)) {
        return res.status(400).json({
          error: 'File type not allowed',
          message: 'This file type is not allowed for security reasons',
        });
      }
    }
  }

  next();
};

// MongoDB query protection (simplified - no blocking)
const mongoQueryProtection = (req, res, next) => {
  // All requests pass through - no blocking
  next();
};

// Export all security middlewares
module.exports = {
  applyHelmet,
  generalRateLimit,
  authRateLimit,
  applyMongoSanitize,
  applyXssProtection,
  additionalSecurityHeaders,
  validateRequest,
  secureFileUpload,
  mongoQueryProtection,
};
