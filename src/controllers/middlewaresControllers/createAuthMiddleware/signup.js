const mongoose = require('mongoose');
const sendEmail = require('@/utils/emailSender');
const { emailVerfication } = require('@/emailTemplate/emailVerfication');
const checkAndCorrectURL = require('./checkAndCorrectURL');
const { useAppSettings } = require('@/settings');
const { CREATED } = require('@/config/httpStatus.config');
const { USER_REGISTERED } = require('@/config/activity.enums');
const {
  errorMessage,
  throwInternalServerError,
  throwMissingFieldsError,
  throwConflictError,
} = require('@/config/error-handler.config');
const { logWithTime } = require('@/utils/time-stamps');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const { generateHash } = require('@/utils/auth');
const { generateNanoId } = require('@/utils/idGenerator');
const { generate: uniqueId } = require('shortid');
const { ROLE_TYPES } = require('@/config/user.config');

const signUp = async (req, res, { userModel }) => {
  try {
    const Admin = mongoose.model(userModel);
    const AdminPassword = mongoose.model(userModel + 'Password');

    const { email, password, code, name, address, city, state, country, pinCode, phoneNumber } =
      req.body;

    if (
      !email ||
      !password ||
      !code ||
      !name ||
      !address ||
      !city ||
      !state ||
      !country ||
      !pinCode ||
      !phoneNumber
    ) {
      return throwMissingFieldsError(res, 'All fields required');
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return throwConflictError(res, 'Email already exists');
    }

    // Create salt and hash password (compatible with existing system)
    const salt = uniqueId();
    const newAdminPassword = new AdminPassword();
    const passwordHash = await newAdminPassword.generateHash(salt, password);

    // Generate email verification token
    const token = await generateNanoId();

    // Create admin user
    const newadmin = {
      email,
      code,
      name,
      cAddress: address,
      city,
      state,
      country,
      pinCode,
      phoneNumber,
      enabled: true, // sirf admin block/unblock ke liye
      role: ROLE_TYPES.OWNER,
    };
    const adminResult = await new Admin(newadmin).save();

    const emailToken = {
      token: token,
      created: new Date(),
    };

    // Save password in AdminPassword model
    const adminPasswordData = {
      password: passwordHash,
      salt,
      emailVerified: false, // ✅ user ko verify karna hoga
      emailToken,
      user: adminResult._id,
    };
    await new AdminPassword(adminPasswordData).save();

    // Send verification email
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${adminResult._id}/${emailToken.token}`;

    const emailHtml = emailVerfication({
      title: 'Verify your email',
      name: name,
      link: verificationLink,
      emailToken: emailToken.token,
    });

    const emailSent = await sendEmail(email, 'Verify your email | ERPICA', emailHtml);

    logWithTime(`✅ 🎯 Admin registered successfully 🚀`);

    // Activity Tracker logging
    await activityTracker({
      userId: adminResult._id, // admin ka Mongo ID as userId
      companyId: adminResult.companyId,
      plantId: null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_register,
      modelAffected: [MODEL_AFFECTED.model_user, MODEL_AFFECTED.model_userPassword],
      eventType: USER_REGISTERED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: adminResult.toObject(),
    });

    // ✅ Case 1: Email send failed but account created
    if (!emailSent) {
      return res.status(CREATED).json({
        success: true,
        adminId: adminResult._id,
        message:
          "Account created successfully, but we couldn't send the verification email. Please try resending verification from your profile or contact support.",
      });
    }

    // ✅ Case 2: All good, email sent
    res.status(CREATED).json({
      success: true,
      adminId: adminResult._id,
      message: 'Signup successful. Please check your email to verify your account before login.',
    });
  } catch (error) {
    logWithTime('❌ Internal Error: Failed to Register a User 🗑️');
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = signUp;
