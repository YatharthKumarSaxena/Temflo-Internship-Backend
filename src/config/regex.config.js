module.exports = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CODE_REGEX: /^[A-Za-z0-9]{4,10}$/,
  PHONE_NUMBER_REGEX: /^[0-9]{10}$/,
  PINCODE_REGEX: /^[0-9]{6}$/,
};
