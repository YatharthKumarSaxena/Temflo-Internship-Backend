const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');
const xlsx = require('xlsx');
const fs = require('fs');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USERS_CREATED_BULK } = require("@/config/activity.enums");
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { EMAIL_TOKEN_EXPIRY } = require("@/config/token.config");
const { generateNanoId } = require('@/utils/idGenerator');

const createBulk = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');
    const Plant = mongoose.model('Plant');

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'Excel file is required' });

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets['Employees'];
    const employeesData = xlsx.utils.sheet_to_json(sheet);


    const companyId = req.admin.companyId;

    // 1. Extract all PlantCodes from Excel
    const plantCodes = [
      ...new Set(
        employeesData
          .map(emp => (emp.PlantCode || '').toString().trim().toUpperCase())
          .filter(Boolean)
      )
    ];

    // 2. Query all matching Plant documents for this company
    const plantDocs = await Plant.find({
      companyId,
      plantCode: { $in: plantCodes },
    });

    // 3. Create a map of PlantCode -> Plant _id
    const plantCodeMap = {};
    for (const plant of plantDocs) {
      plantCodeMap[plant.plantCode] = plant._id;
    }

    const emails = employeesData.map(emp => emp.Email?.toLowerCase());
    const employeeCodes = employeesData.map(emp => emp.EmployeeCode);

    const existingUsers = await User.find({
      companyId,
      removed:false,
      $or: [
        { email: { $in: emails } },
        { employeeCode: { $in: employeeCodes } },
      ]
    });

    const existingEmailSet = new Set(existingUsers.map(u => u.email));
    const existingCodeSet = new Set(existingUsers.map(u => u.employeeCode));

    const success = [];
    const duplicates = [];
    const failed = [];

    for (const emp of employeesData) {
      const email = emp.Email?.toLowerCase();
      const employeeCode = emp.EmployeeCode;
      const plantCode = (emp.PlantCode || '').toString().trim().toUpperCase();


      if (!email || !emp.Password || !employeeCode || !plantCode) {
        failed.push({ ...emp, reason: 'Missing required fields (Email, Password, EmployeeCode, PlantCode)' });
        continue;
      }

      if (existingEmailSet.has(email) || existingCodeSet.has(employeeCode)) {
        duplicates.push({ ...emp, reason: 'Duplicate email or employeeCode' });
        continue;
      }

      const plantId = plantCodeMap[plantCode];
      if (!plantId) {
        failed.push({ ...emp, reason: `PlantCode '${plantCode}' not found in company` });
        continue;
      }

      try {
        const salt = uniqueId();
        const userPassword = new UserPassword();
        const passwordHash = await userPassword.generateHash(salt, emp.Password.toString());

        const newUser = new User({
          email,
          employeeCode,
          companyId,
          name: emp.Name,
          mobile: emp.Mobile,
          plantId,
          role:"employee"
        });

        const savedUser = await newUser.save();

            // Generate email verification token
        const token = await generateNanoId();

        const emailToken = {
          token: token,
          created: new Date(),
         };

        const userPasswordData = new UserPassword({
          password: passwordHash,
          salt,
          emailVerified: false,
          emailToken,
          user: savedUser._id
        });

        await userPasswordData.save();

              // Send verification email
              const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
              const verificationLink = `${baseUrl}/verify/${savedUser._id}/${emailToken.token}`;
        
              const emailConfig = {
                ...masterTemplate.employeeCreation,
                user_name: emp.Name || "User",
                actionlink: verificationLink, // dynamic verification link
                action_link: verificationLink,
              };
              const html = generateMasterTemplate(emailConfig);
              sendEmail(email, emailConfig.subject, html); // fire-and-forget
        success.push(savedUser.toObject());

        existingEmailSet.add(email);
        existingCodeSet.add(employeeCode);

      } catch (err) {
        failed.push({ ...emp, reason: err.message });
      }
    }

    fs.unlinkSync(file.path); // Cleanup uploaded Excel file

for (const user of success) {

  activityTracker({
    userId: req.admin._id,
    companyId: req.admin.companyId,
    plantId: req.admin.plantId || null,
    module: MODULE.core,
    subModuleAffected: SUBMODULE.user,
    fileAffected: FILE.file_user_createBulk,
    modelAffected: [MODEL_AFFECTED.model_user, MODEL_AFFECTED.model_userPassword],
    eventType: USERS_CREATED_BULK,
    actionDone: ACTIONS.create,
    oldData: null,
    newData: user
  });
}

    
    return res.status(200).json({
      success: true,
      message: 'Bulk user upload complete',
      logs: {
        created: success,
        duplicates,
        failed
      }
    });
  } catch (error) {
    console.error('User Creation In Bulk Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createBulk;