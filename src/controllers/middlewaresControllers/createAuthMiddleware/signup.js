
const mongoose = require('mongoose');
const { sendEmail } = require('@/utils/emailSender');
const { emailVerfication } = require('@/emailTemplate/emailVerfication');
const { CREATED } = require('@/config/httpStatus.config');
const { USER_REGISTERED } = require('@/config/activity.enums');
const {
  errorMessage,
  throwInternalServerError,
  throwMissingFieldsError,
  throwConflictError,
} = require('@/config/error-handler.config');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require('@/config/structure.config');
const { activityTracker } = require('@/utils/activityTracker');
const { generateNanoId } = require('@/utils/idGenerator');
const { generate: uniqueId } = require('shortid');
const { ROLE_TYPES } = require('@/config/user.config');
const { getFullName } = require('@/utils/commonFunctions');

// Import models
const Company = require('@/models/userModels/User');
const Plan = require('@/models/BusinessModels/Plan');
const Subscription = require('@/models/BusinessModels/Subscription');

const signUp = async (req, res, { userModel }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Admin = mongoose.model(userModel);
    const AdminPassword = mongoose.model(userModel + 'Password');

    const {
      email,
      password,
      code,
      name,
      address,
      city,
      state,
      country,
      pinCode,
      phoneNumber,
    } = req.body;

    // ✅ 1. Validation
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

    const isValidCompanyCode = /^[A-Za-z\d]{4}$/.test(code || '');
    if (!isValidCompanyCode) {
      return throwMissingFieldsError(
        res,
        'Invalid Company Code. Use exactly 4 letters and/or digits'
      );
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return throwConflictError(res, 'Email already exists');
    }

    // ✅ 1. Create Admin User
    const salt = uniqueId();
    const newAdminPassword = new AdminPassword();
    const passwordHash = await newAdminPassword.generateHash(salt, password);
    const token = await generateNanoId();

    const newAdmin = new Admin({
      email,
      code,
      name,
      cAddress: address,
      city,
      state,
      country,
      pinCode,
      phoneNumber,
      enabled: true,
      role: ROLE_TYPES.OWNER,
    });
    const adminResult = await newAdmin.save({ session });
    const companyId = adminResult.companyId

    // ✅ 3. Create Trial Plan
    const trialPlan = await Plan.create(
      [
        {
          companyId,
          name: 'Trial',
          durationDays: 45,
          seatLimit: 10,
          status: 'trial',
          includedModules: [
            { moduleKey: 'leave', plan: 'basic', enabled: true },
            { moduleKey: 'attendance', plan: 'basic', enabled: true },
            { moduleKey: 'expense', plan: 'basic', enabled: true },
            { moduleKey: 'task', plan: 'basic', enabled: true },
            { moduleKey: 'asset', plan: 'basic', enabled: true },
          ],
        },
      ],
      { session }
    );
    const planId = trialPlan[0]._id;

    // ✅ 4. Create Subscription for 45 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 45);

    const subscription = await Subscription.create(
      [
        {
          companyId,
          planId,
          startDate: new Date(),
          endDate,
          amount: 0,
          paymentStatus: 'paid',
        },
      ],
      { session }
    );


    const emailToken = {
      token,
      created: new Date(),
    };

    const adminPasswordData = {
      password: passwordHash,
      salt,
      emailVerified: false,
      emailToken,
      user: adminResult._id,
    };
    await new AdminPassword(adminPasswordData).save({ session });


    // ✅ 8. Send Verification Email
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const verificationLink = `${baseUrl}/verify/${adminResult._id}/${emailToken.token}`;

    const emailHtml = emailVerfication({
      title: 'Verify your email',
      name: getFullName(adminResult.employeeInfo),
      link: verificationLink,
      emailToken: emailToken.token,
    });

    const emailSent = await sendEmail(email, 'Verify your email | ERPICA', emailHtml);

    // ✅ 9. Log Activity
    activityTracker({
      userId: adminResult._id,
      companyId,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_register,
      modelAffected: [
        MODEL_AFFECTED.model_user,
        MODEL_AFFECTED.model_userPassword,
      ],
      eventType: USER_REGISTERED,
      actionDone: ACTIONS.create,
      description: `New account registered: ${getFullName(
        adminResult.employeeInfo
      )} (${adminResult.email}, Code: ${adminResult.code})`,
      oldData: null,
      newData: adminResult.toObject(),
    });

    await session.commitTransaction();
    session.endSession();

    if (!emailSent) {
      return res.status(CREATED).json({
        success: true,
        adminId: adminResult._id,
        message:
          "Account created successfully, but verification email couldn't be sent. Please try resending verification or contact support.",
      });
    }

    return res.status(CREATED).json({
      success: true,
      adminId: adminResult._id,
      message:
        'Signup successful. Please verify your email before logging in.',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = signUp;

