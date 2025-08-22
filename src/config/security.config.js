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
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Strict rate limiting for auth endpoints
  authRateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 requests per windowMs for auth
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // CORS configuration
  cors: {
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
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
