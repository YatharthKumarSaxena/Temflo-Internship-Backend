const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('express-xss-sanitizer');

// Security configuration
const securityConfig = {
  // Bcrypt salt rounds
  SALT_ROUNDS: parseInt(process.env.SALT) || 12,
  // Helmet configuration for security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Explicitly enable all security headers
    frameguard: { action: 'deny' },
    xssFilter: true,
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
  },

  // Rate limiting configuration (200 requests per minute)
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 1) * 60 * 1000, // 1 minute default
    max: parseInt(process.env.RATE_LIMIT_MAX) || 200, // 200 requests default
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: `${parseInt(process.env.RATE_LIMIT_WINDOW) || 1} minute`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : true, // Allow all origins for development if not specified
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Accept',
      'plant-id', // Allow plant-id header
      'company-id', // Allow company-id header
      'user-id', // Allow user-id header
      'X-Plant-ID', // Alternative naming
      'X-Company-ID', // Alternative naming
      'X-User-ID', // Alternative naming
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  },

  // MongoDB sanitization
  mongoSanitize: {
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`MongoDB injection attempt detected: ${key} in ${req.originalUrl}`);
    },
  },

  // XSS protection
  xss: {
    sanitize: true,
    sanitizeOptions: {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    },
  },

  // File upload security
  fileUpload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 5, // max 5 files per request
    },
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
    safeFileNames: true,
    preserveExtension: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: process.env.NODE_ENV === 'development',
  },
};

module.exports = securityConfig;
