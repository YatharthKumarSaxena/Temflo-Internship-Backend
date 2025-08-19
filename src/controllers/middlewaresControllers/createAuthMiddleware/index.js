const isValidAuthToken = require('./isValidAuthToken');
const login = require('./login');
const logout = require('./logout');
const signUp = require('./signup');
const forgetPassword = require('./forgetPassword');
const resetPassword = require('./resetPassword');
const getName = require('./getName');
const verifyEmail = require('./verifyEmail');
const resendVerificationEmail = require('./resendVerificationMail');

const createAuthMiddleware = (userModel) => {
  let authMethods = {};

  authMethods.isValidAuthToken = (req, res, next) =>
    isValidAuthToken(req, res, next, {
      userModel,
    });

  authMethods.signUp = (req, res) => signUp(req, res, { userModel });

  authMethods.login = (req, res) =>
    login(req, res, {
      userModel,
    });

  authMethods.forgetPassword = (req, res) =>
    forgetPassword(req, res, {
      userModel,
    });

  authMethods.resetPassword = (req, res) =>
    resetPassword(req, res, {
      userModel,
    });

  authMethods.logout = (req, res) =>
    logout(req, res, {
      userModel,
    });

  authMethods.verifyEmail = (req, res) =>
    verifyEmail(req, res, {
      userModel,
    });

  authMethods.resendVerificationMail = (req, res) =>
    resendVerificationEmail(req, res, {
      userModel,
    });

  authMethods.getName = (req, res) =>
    getName(req, res, {
      userModel,
    });
  return authMethods;
};

module.exports = createAuthMiddleware;
