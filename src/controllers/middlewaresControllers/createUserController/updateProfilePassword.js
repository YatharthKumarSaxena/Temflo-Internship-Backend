const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PASSWORD_UPDATED_BY_SELF } = require("@/config/activity.enums");
const { generate: uniqueId } = require('shortid');
const { getFullName } = require("@/utils/commonFunctions");

const updateProfilePassword = async (userModel, req, res) => {
  const UserPassword = mongoose.model(userModel + 'Password');

  const reqUserName = userModel.toLowerCase();
  const userProfile = req[reqUserName];
  let { password, passwordCheck } = req.body;

  if (!password || !passwordCheck)
    return res.status(400).json({ msg: 'Not all fields have been entered.' });

  if (password.length < 8)
    return res.status(400).json({
      msg: 'The password needs to be at least 8 characters long.',
    });

  if (password !== passwordCheck)
    return res.status(400).json({ msg: 'Enter the same password twice for verification.' });

  // Find document by id and updates with the required fields

  const salt = uniqueId();

  const passwordHash = bcrypt.hashSync(salt + password);

  const UserPasswordData = {
    password: passwordHash,
    salt: salt,
  };

  const resultPassword = await UserPassword.findOneAndUpdate(
    { user: userProfile._id, removed: false },
    { $set: UserPasswordData },
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();

  if (!resultPassword) {
    return res.status(403).json({
      success: false,
      result: null,
      message: "User Password couldn't save correctly",
    });
  }

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createUser,
      fileAffected: FILE.file_createUser_updateProfilePassword,
      modelAffected: [MODEL_AFFECTED.model_userPassword],
      eventType: USER_PASSWORD_UPDATED_BY_SELF,
      actionDone: ACTIONS.update,
      description: `Password updated by ${getFullName(req.admin.employeeInfo)} for ${getFullName(userProfile.employeeInfo)} whose user Id: ${userProfile._id}`,
      oldData: { _id: userProfile._id, passwordChanged: false },
      newData: { passwordChanged: true }
    });
    
  return res.status(200).json({
    success: true,
    result: {},
    message: 'we update the password by this id: ' + userProfile._id,
  });
};

module.exports = updateProfilePassword;