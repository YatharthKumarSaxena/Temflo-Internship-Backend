const fs = require('fs');
const path = require('path');

// Basic security monitoring configuration (IP blocking removed)
const securityMonitoringConfig = {
  logFile: path.join(__dirname, '../../logs/security.log'),
};

// Ensure log directory exists
const ensureLogDirectory = () => {
  const logDir = path.dirname(securityMonitoringConfig.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

// Log security event
const logSecurityEvent = (level, message, details = {}) => {
  ensureLogDirectory();

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    url: details.url || 'unknown',
  };

  const logLine = `${timestamp} [${level.toUpperCase()}] ${message} - IP: ${logEntry.ip} - URL: ${
    logEntry.url
  } - User-Agent: ${logEntry.userAgent}\n`;

  fs.appendFileSync(securityMonitoringConfig.logFile, logLine);
};

// Placeholder middleware - no IP blocking
const ipBlockingMiddleware = (req, res, next) => {
  // IP blocking completely removed - all requests pass through
  next();
};

// Placeholder middleware - no failed attempt tracking
const trackFailedAttempts = (req, res, next) => {
  // Failed attempt tracking completely removed - all requests pass through
  next();
};

// Placeholder middleware - no suspicious activity detection
const detectSuspiciousActivity = (req, res, next) => {
  // Suspicious activity detection completely removed - all requests pass through
  next();
};

// Security headers monitoring
const monitorSecurityHeaders = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;

  // Override send method to check headers before sending response
  res.send = function (data) {
    // Check if security headers are present in the response
    const securityHeaders = {
      'X-Frame-Options': res.getHeader('X-Frame-Options'),
      'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
      'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
      'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
    };

    // Log missing security headers
    const missingHeaders = Object.entries(securityHeaders)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingHeaders.length > 0) {
      logSecurityEvent('warn', 'Missing security headers in response', {
        ip: req.ip,
        url: req.originalUrl,
        missingHeaders,
      });
    } else {
      // Log when all security headers are present
      logSecurityEvent('info', 'All security headers present', {
        ip: req.ip,
        url: req.originalUrl,
        headers: Object.keys(securityHeaders),
      });
    }

    // Call the original send method
    return originalSend.call(this, data);
  };

  next();
};

// Rate limiting monitoring (simplified)
const monitorRateLimiting = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Monitor rate limiting effectiveness
  if (res.statusCode === 429) {
    logSecurityEvent('info', 'Rate limit triggered', {
      ip: clientIP,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
    });
  }

  next();
};

// Export monitoring middlewares
module.exports = {
  ipBlockingMiddleware,
  trackFailedAttempts,
  detectSuspiciousActivity,
  monitorSecurityHeaders,
  monitorRateLimiting,
  logSecurityEvent,
  securityMonitoringConfig,
};
