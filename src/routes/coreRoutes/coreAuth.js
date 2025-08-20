const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const { admin } = require('@/locale/translation/en_us');

router.route('/signup').post(catchErrors(adminAuth.signUp));
router.route('/login').post(catchErrors(adminAuth.login));

// ✅ New Email Verification Routes
router.route('/verify-email').post(catchErrors(adminAuth.verifyEmail));
router.route('/resend-verification').post(catchErrors(adminAuth.resendVerificationMail));

router.route('/get-companyname/:id').get(catchErrors(adminAuth.getName));

router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));

router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
