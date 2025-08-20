module.exports = {
  NANO_ID_LENGTH: parseInt(process.env.NANO_ID_LENGTH || '16', 10), // decimal parse
  SALT_ROUNDS: Number(process.env.SALT) || 12, // fallback to 12 if env variable missing
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // minutes → ms
  max: Number(process.env.RATE_LIMIT_MAX), // requests per window
  userTimeLimit: Number(process.env.RATE_LIMIT_TIME_USER),
  userAttempsLimit: Number(process.env.RATE_LIMIT_MAX_USER),
};
