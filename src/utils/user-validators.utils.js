const { logWithTime } = require('./time-stamps');
const { throwBadRequestError } = require('@/config/error-handler.config');
const {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  CODE_REGEX,
  PHONE_NUMBER_REGEX,
  PINCODE_REGEX,
} = require('@/config/regex.config');

const isValidEmail = (email, res) => {
  if (!EMAIL_REGEX.test(email)) {
    logWithTime('❌ Invalid Email Format');
    throwBadRequestError(res, 'Invalid email format. Please enter a valid email address.');
    return false;
  }
  return true;
};

const isValidPassword = (password, res) => {
  if (!PASSWORD_REGEX.test(password)) {
    logWithTime('❌ Invalid Password Format');
    throwBadRequestError(
      res,
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    );
    return false;
  }
  return true;
};

const isValidCode = (code, res) => {
  if (!CODE_REGEX.test(code)) {
    logWithTime('❌ Invalid Code Format');
    throwBadRequestError(
      res,
      'Invalid code format. Code should be alphanumeric and 4-10 characters long.'
    );
    return false;
  }
  return true;
};

const isValidPhoneNumber = (phoneNumber, res) => {
  if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
    logWithTime('❌ Invalid Phone Number Format');
    throwBadRequestError(
      res,
      'Invalid phone number format. Please enter a valid 10-digit phone number.'
    );
    return false;
  }
  return true;
};

const isValidPincode = (pincode, res) => {
  if (!PINCODE_REGEX.test(pincode)) {
    logWithTime('❌ Invalid Pincode Format');
    throwBadRequestError(res, 'Invalid pincode format. Pincode should be 6 digits.');
    return false;
  }
  return true;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidCode,
  isValidPhoneNumber,
  isValidPincode,
};
