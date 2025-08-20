module.exports = {
  httpOnly: process.env.COOKIE_HTTP_ONLY === 'true' || true,
  secure: process.env.COOKIE_SECURE === 'true' || true,
  sameSite: process.env.COOKIE_SAME_SITE || 'None',
};
