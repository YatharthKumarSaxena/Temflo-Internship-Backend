const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const UserPasswordSchema = new Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
    password: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length >= 8;
        },
        message: 'Password must be at least 8 characters long.',
      },
    },
    emailToken: {
      token: String,
      created: Date,
    },
    resetToken: {
      token: String,
      created: Date,
    },
    salt: {
      type: String,
      // Optional for backward compatibility
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authType: {
      type: String,
      default: 'email',
    },
    // Enhanced session management
    activeSessions: [
      {
        accessToken: String,
        refreshToken: String,
        tokenVersion: { type: Number, default: 1 },
        deviceInfo: {
          userAgent: String,
          ip: String,
          deviceId: String,
        },
        lastActivity: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],

    // Token blacklist for logout/revocation
    blacklistedTokens: [
      {
        token: String,
        revokedAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
    // Password history (optional - for preventing password reuse)
    passwordHistory: [
      {
        hash: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Security settings
    tokenVersion: { type: Number, default: 1 },
    lastPasswordChange: { type: Date, default: Date.now },
    lastCleanup: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Standardized password hashing (no more separate salt field)
UserPasswordSchema.methods.generateHash = async function (saltOrPassword, password) {
  // Handle both old (salt, password) and new (password) parameter formats
  if (password !== undefined) {
    // Old format: generateHash(salt, password) - combine them for backward compatibility
    const combined = saltOrPassword + password;
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    return await bcrypt.hash(combined, saltRounds);
  } else {
    // New format: generateHash(password) - use bcrypt directly
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    return await bcrypt.hash(saltOrPassword, saltRounds);
  }
};

// Standardized password validation
UserPasswordSchema.methods.validPassword = async function (password) {
  try {
    // First try direct bcrypt comparison (new format)
    const directMatch = await bcrypt.compare(password, this.password);
    if (directMatch) {
      return true;
    }

    // If that fails and we have a salt field, try old format (salt + password)
    if (this.salt) {
      const combinedPassword = this.salt + password;
      const saltMatch = await bcrypt.compare(combinedPassword, this.password);
      if (saltMatch) {
        return true;
      }

      // Also try the old hashSync format that was used
      const oldHash = bcrypt.hashSync(combinedPassword);
      if (oldHash === this.password) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
};

// Session management methods
UserPasswordSchema.methods.addSession = function (sessionData) {
  this.activeSessions.push(sessionData);
  return this.save();
};

UserPasswordSchema.methods.removeSession = function (tokenOrId) {
  this.activeSessions = this.activeSessions.filter(
    (session) =>
      session.accessToken !== tokenOrId &&
      session.refreshToken !== tokenOrId &&
      session._id.toString() !== tokenOrId
  );
  return this.save();
};

UserPasswordSchema.methods.cleanupExpiredSessions = function () {
  const now = new Date();
  this.activeSessions = this.activeSessions.filter((session) => session.expiresAt > now);

  // Clean up expired blacklisted tokens
  this.blacklistedTokens = this.blacklistedTokens.filter((token) => token.expiresAt > now);

  this.lastCleanup = now;
  return this.save();
};

UserPasswordSchema.methods.blacklistToken = function (token, expiresAt) {
  this.blacklistedTokens.push({
    token,
    expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
  });
  return this.save();
};

UserPasswordSchema.methods.isTokenBlacklisted = function (token) {
  return this.blacklistedTokens.some(
    (blacklisted) => blacklisted.token === token && blacklisted.expiresAt > new Date()
  );
};

// Auto-cleanup middleware
UserPasswordSchema.pre('save', function (next) {
  // Auto cleanup if last cleanup was more than 24 hours ago
  if (!this.lastCleanup || Date.now() - this.lastCleanup > 24 * 60 * 60 * 1000) {
    this.cleanupExpiredSessions();
  }
  next();
});

module.exports = mongoose.model('UserPassword', UserPasswordSchema);
