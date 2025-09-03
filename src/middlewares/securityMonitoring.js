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

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${level.toUpperCase()}] ${message}`, details);
  }
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
  const securityHeaders = {
    'X-Frame-Options': req.headers['x-frame-options'],
    'X-Content-Type-Options': req.headers['x-content-type-options'],
    'X-XSS-Protection': req.headers['x-xss-protection'],
    'Strict-Transport-Security': req.headers['strict-transport-security'],
  };

  // Log missing security headers
  const missingHeaders = Object.entries(securityHeaders)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingHeaders.length > 0) {
    logSecurityEvent('info', 'Missing security headers', {
      ip: req.ip,
      url: req.originalUrl,
      missingHeaders,
    });
  }

  next();
};

// Rate limiting monitoring
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
