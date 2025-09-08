// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

// Extracts file that include timeStamp function
const { logWithTime } = require('@/utils/time-stamps');
const {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  NOT_FOUND,
} = require('./httpStatus.config');

exports.errorMessage = (err) => {
  logWithTime('🛑 Error occurred:');
  logWithTime('File Name and Line Number where this error occurred is displayed below:- ');
  console.log(err.stack);
  logWithTime('Error Message is displayed below:- ');
  console.error(err.message);
  return;
};

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

exports.throwMissingFieldsError = (res, resource) => {
  logWithTime('⚠️ Missing required fields in the request:');
  console.log(resource);
  if (res.headersSent) return; // 🔐 Prevent duplicate send
  return res.status(BAD_REQUEST).json({
    success: false,
    warning: 'The following required field(s) are missing:',
    fields: resource,
    message: 'Please provide the required fields to proceed.',
  });
};

/*
  ✅ SRP + DRY: 
  Handles all internal server failure responses.
*/

exports.throwInternalServerError = (res) => {
  logWithTime('💥 Internal Server Error occurred.');
  if (res.headersSent) return; // 🔐 Prevent duplicate send
  return res.status(INTERNAL_SERVER_ERROR).json({
    success: false,
    response: 'An internal server error occurred while processing your request.',
    message: 'We apologize for the inconvenience. Please try again later.',
  });
};

/*
  ✅ SRP + DRY: 
  Handles all credentials failure responses.
*/

exports.throwInvalidResourceError = (res, resource) => {
  logWithTime('⚠️ Invalid ' + resource);
  logWithTime('❌ Invalid Credentials! Please try again.');
  if (res.headersSent) return; // 🔐 Prevent duplicate send
  return res.status(UNAUTHORIZED).json({
    success: false,
    type: 'InvalidResource',
    resource: resource,
    warning: 'Invalid ' + resource + ' Entered',
    message: 'Please enter a Valid ' + resource,
  });
};

/*
  ✅ SRP + DRY: 
  Handles Access Denied or Blocked Account responses.
*/

exports.throwAccessDeniedError = (res, reason = 'Access Denied') => {
  logWithTime('⛔️ Access Denied: ' + reason);
  if (res.headersSent) return; // 🔐 Prevent duplicate send
  return res.status(FORBIDDEN).json({
    success: false,
    type: 'AccessDenied',
    warning: reason,
    message: 'You do not have the necessary permissions to perform this action.',
  });
};

/*
  ✅ SRP + DRY:
  Handles Blocked Account responses.
*/

exports.throwBlockedAccountError = (res) => {
  logWithTime('⛔️ Blocked Account');
  if (res.headersSent) return; // 🔐 Prevent duplicate send
  return res.status(FORBIDDEN).json({
    success: false,
    type: 'BlockedAccount',
    message: 'Your account is disabled, contact your account adminstrator',
  });
};

exports.logMiddlewareError = (context, req) => {
  const userId = req?.foundUser?.userId || req?.user?.userId || 'UNKNOWN_USER';
  logWithTime(`❌ Middleware Error: [${context}] | User: (${userId})`);
};

exports.throwConflictError = (res, message, suggestion) => {
  logWithTime('⚔️ Conflict Detected: ' + message);
  if (res.headersSent) return;
  return res.status(CONFLICT).json({
    success: false,
    message,
    suggestion,
  });
};

exports.throwDBResourceNotFoundError = (res, resourceName = 'Resource') => {
  logWithTime(`🔍 ${resourceName} not found`);
  if (res.headersSent) return;
  return res.status(NOT_FOUND).json({
    success: false,
    type: 'NotFound',
    message: `${resourceName} not found or you do not have access to this ${resourceName}.`,
  });
};

exports.getLogIdentifiers = (req) => {
  const userId = req?.foundUser?.userId || req?.user?.userId || 'UNKNOWN_USER';
  return `with User ID: (${userId}). Request is made from device ID: (${req.deviceID})`;
};

exports.throwBadRequestError = (res, message = 'Bad Request: Invalid or missing data.') => {
  logWithTime('⚠️ Bad Request: ' + message);
  if (res.headersSent) return;
  return res.status(BAD_REQUEST).json({
    success: false,
    message,
  });
};
