const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PASSWORD_UPDATED_BY_ID } = require("@/config/activity.enums");
const { employeeTemplate } = require("@/config/emailTemplates/employeeTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const updatePassword = async (userModel, req, res) => {
  const UserPassword = mongoose.model(userModel + 'Password');

  const reqUserName = userModel.toLowerCase();
  const userProfile = req[reqUserName];

  let { password } = req.body;

  if (password.length < 8)
    return res.status(400).json({
      msg: 'The password needs to be at least 8 characters long.',
    });

  // Find document by id and updates with the required fields

  const salt = uniqueId();

  const passwordHash = bcrypt.hashSync(salt + password);

  const UserPasswordData = {
    password: passwordHash,
    salt: salt,
  };

  const resultPassword = await UserPassword.findOneAndUpdate(
    { user: req.params.id, removed: false },
    { $set: UserPasswordData },
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();

  // Code to handle the successful response

  if (!resultPassword) {
    return res.status(403).json({
      success: false,
      result: null,
      message: "User Password couldn't save correctly",
    });
  }

  // Fetch user for email
  const User = mongoose.model(userModel);
  const targetUser = await User.findById(req.params.id).lean();

  if (targetUser?.email) {
    // Inject dynamic values into template
    const emailConfig = {
      ...employeeTemplate.userPasswordChanged,
      user_name: targetUser.name || "User",
    };

    const html = generateMasterTemplate(emailConfig);

    // Fire & Forget (async, don’t block API response)
    sendEmail(targetUser.email, emailConfig.subject, html);
  }
    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createUser,
      fileAffected: FILE.file_createUser_updatePassword,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_PASSWORD_UPDATED_BY_ID,
      actionDone: ACTIONS.update,
      oldData: { _id: req.params.id, passwordChanged: false },
      newData: { passwordChanged: true }
    });
    
  return res.status(200).json({
    success: true,
    result: {},
    message: 'we update the password by this id: ' + req.params.id
  });
};

module.exports = updatePassword;