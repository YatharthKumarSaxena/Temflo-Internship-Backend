const authService = require('@/services/authService');

const refreshToken = async (req, res, { userModel }) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Refresh token is required',
        error: 'REFRESH_TOKEN_MISSING',
      });
    }

    // Use auth service to refresh tokens
    const result = await authService.refreshTokens(refreshToken, userModel);

    // Set new cookies
    res
      .cookie('token', result.accessToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
        sameSite:
          process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: process.env.COOKIE_PATH || '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

    res.status(200).json({
      success: true,
      result: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.accessExpiresAt,
      },
      message: 'Tokens refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    // Clear cookies if refresh fails
    res.clearCookie('token').clearCookie('refreshToken');

    // Determine error type and status code
    let statusCode = 401;
    let errorCode = 'REFRESH_FAILED';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'USER_NOT_FOUND';
    } else if (error.message.includes('disabled')) {
      statusCode = 403;
      errorCode = 'ACCOUNT_DISABLED';
    } else if (error.message.includes('revoked')) {
      statusCode = 401;
      errorCode = 'TOKEN_REVOKED';
    } else if (error.message.includes('version')) {
      statusCode = 401;
      errorCode = 'TOKEN_VERSION_MISMATCH';
    }

    res.status(statusCode).json({
      success: false,
      result: null,
      message: error.message || 'Failed to refresh token',
      error: errorCode,
      jwtExpired: true,
    });
  }
};

module.exports = refreshToken;
