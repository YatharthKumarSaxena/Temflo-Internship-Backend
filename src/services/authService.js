const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Async import for nanoid (ES module)
let _nanoid;
async function loadNanoid() {
  if (!_nanoid) {
    const mod = await import('nanoid');
    _nanoid = mod.nanoid;
  }
  return _nanoid;
}

// Enhanced JWT and Authentication Service
class AuthService {
  constructor() {
    this.jwtConfig = {
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1d',
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      issuer: process.env.JWT_ISSUER || 'erp-system',
      audience: process.env.JWT_AUDIENCE || 'erp-users',
      clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE) || 30,
    };
  }

  // Generate secure access and refresh tokens with rotation
  async generateTokenPair(payload, deviceInfo = {}) {
    const nanoid = await loadNanoid();
    const tokenId = nanoid();
    const tokenVersion = payload.tokenVersion || 1;

    const accessTokenPayload = {
      id: String(payload.id || payload._id),
      companyId: payload.companyId ? String(payload.companyId) : undefined,
      role: payload.role,
      tokenVersion,
      type: 'access',
      jti: tokenId,
    };

    const refreshTokenPayload = {
      id: String(payload.id || payload._id),
      companyId: payload.companyId ? String(payload.companyId) : undefined,
      tokenVersion,
      type: 'refresh',
      jti: nanoid(),
      deviceId: deviceInfo.deviceId || nanoid(),
    };

    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      expiresIn: this.jwtConfig.accessTokenExpiry,
      algorithm: this.jwtConfig.algorithm,
      issuer: this.jwtConfig.issuer,
      audience: this.jwtConfig.audience,
      subject: String(payload.id || payload._id),
    });

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: this.jwtConfig.refreshTokenExpiry,
        algorithm: this.jwtConfig.algorithm,
        issuer: this.jwtConfig.issuer,
        audience: this.jwtConfig.audience,
        subject: String(payload.id || payload._id),
      }
    );

    // Calculate expiration times
    const now = new Date();
    const accessExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
      tokenVersion,
      deviceInfo: {
        ...deviceInfo,
        deviceId: refreshTokenPayload.deviceId,
      },
    };
  }

  // Verify and decode token with enhanced security
  async verifyToken(token, tokenType = 'access') {
    try {
      const secret =
        tokenType === 'refresh'
          ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
          : process.env.JWT_SECRET;

      const decoded = jwt.verify(token, secret, {
        algorithms: [this.jwtConfig.algorithm],
        issuer: this.jwtConfig.issuer,
        audience: this.jwtConfig.audience,
        clockTolerance: this.jwtConfig.clockTolerance,
      });

      // Verify token type matches expectation
      if (decoded.type !== tokenType) {
        throw new Error(`Invalid token type. Expected ${tokenType}, got ${decoded.type}`);
      }

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Refresh token with rotation
  async refreshTokens(refreshToken, userModel = 'User') {
    try {
      // Verify the refresh token
      const decoded = await this.verifyToken(refreshToken, 'refresh');

      const UserPassword = mongoose.model(userModel + 'Password');
      const User = mongoose.model(userModel);

      // Get user and password data
      const [user, userPassword] = await Promise.all([
        User.findById(decoded.id),
        UserPassword.findOne({ user: decoded.id }),
      ]);

      if (!user || !userPassword) {
        throw new Error('User not found');
      }

      if (user.removed) {
        throw new Error('User account is disabled');
      }

      // Check if token is blacklisted
      if (userPassword.isTokenBlacklisted(refreshToken)) {
        throw new Error('Token has been revoked');
      }

      // Check token version (for invalidating all tokens)
      if (decoded.tokenVersion !== userPassword.tokenVersion) {
        throw new Error('Token version mismatch - please login again');
      }

      // Find the session
      const session = userPassword.activeSessions.find((s) => s.refreshToken === refreshToken);

      if (!session) {
        throw new Error('Session not found');
      }

      // Clean up expired sessions
      await userPassword.cleanupExpiredSessions();

      // Generate new token pair
      const deviceInfo = session.deviceInfo;
      const newTokens = await this.generateTokenPair(
        {
          id: user._id,
          companyId: user.companyId,
          role: user.role,
          tokenVersion: userPassword.tokenVersion,
        },
        deviceInfo
      );

      // Blacklist old tokens
      await userPassword.blacklistToken(session.accessToken, session.expiresAt);
      await userPassword.blacklistToken(refreshToken, new Date(decoded.exp * 1000));

      // Remove old session
      await userPassword.removeSession(refreshToken);

      // Add new session
      await userPassword.addSession({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenVersion: newTokens.tokenVersion,
        deviceInfo: newTokens.deviceInfo,
        lastActivity: new Date(),
        expiresAt: newTokens.refreshExpiresAt,
      });

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        accessExpiresAt: newTokens.accessExpiresAt,
        refreshExpiresAt: newTokens.refreshExpiresAt,
        user: {
          _id: user._id,
          name: user.name,
          surname: user.surname,
          role: user.role,
          email: user.email,
          photo: user.photo,
          permissions: user.permissions,
        },
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Extract device information from request
  extractDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Generate a device fingerprint
    const deviceFingerprint = crypto
      .createHash('sha256')
      .update(userAgent + ip)
      .digest('hex')
      .substring(0, 16);

    return {
      userAgent,
      ip,
      deviceId: deviceFingerprint,
    };
  }

  // Create new session
  async createSession(user, userPassword, req) {
    const deviceInfo = this.extractDeviceInfo(req);

    const tokens = await this.generateTokenPair(
      {
        id: user._id,
        companyId: user.companyId,
        role: user.role,
        tokenVersion: userPassword.tokenVersion,
      },
      deviceInfo
    );

    // Add session to user
    await userPassword.addSession({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenVersion: tokens.tokenVersion,
      deviceInfo: tokens.deviceInfo,
      lastActivity: new Date(),
      expiresAt: tokens.refreshExpiresAt,
    });

    return tokens;
  }

  // Logout and blacklist tokens
  async logout(token, userModel = 'User', logoutAll = false) {
    try {
      const decoded = await this.verifyToken(token, 'access');
      const UserPassword = mongoose.model(userModel + 'Password');

      const userPassword = await UserPassword.findOne({ user: decoded.id });
      if (!userPassword) {
        return false;
      }

      if (logoutAll) {
        // Logout from all devices
        for (const session of userPassword.activeSessions) {
          await userPassword.blacklistToken(session.accessToken, session.expiresAt);
          await userPassword.blacklistToken(session.refreshToken, session.expiresAt);
        }
        userPassword.activeSessions = [];
        userPassword.tokenVersion += 1; // Invalidate all tokens
      } else {
        // Logout from current device only
        const session = userPassword.activeSessions.find((s) => s.accessToken === token);

        if (session) {
          await userPassword.blacklistToken(session.accessToken, session.expiresAt);
          await userPassword.blacklistToken(session.refreshToken, session.expiresAt);
          await userPassword.removeSession(token);
        }
      }

      await userPassword.save();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Session cleanup service (to be called periodically)
  async cleanupExpiredSessions(userModel = 'User') {
    try {
      const UserPassword = mongoose.model(userModel + 'Password');

      const result = await UserPassword.updateMany(
        {},
        {
          $pull: {
            activeSessions: { expiresAt: { $lt: new Date() } },
            blacklistedTokens: { expiresAt: { $lt: new Date() } },
          },
          $set: {
            lastCleanup: new Date(),
          },
        }
      );

      console.log(`Cleaned up expired sessions for ${result.modifiedCount} users`);
      return result;
    } catch (error) {
      console.error('Session cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
