const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PROFILE_UPDATED } = require("@/config/activity.enums");
const { throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { getFullName } = require("@/utils/commonFunctions");

const updateProfile = async (userModel, req, res) => {
  const User = mongoose.model(userModel);

  const reqUserName = userModel.toLowerCase();
  const userProfile = req[reqUserName];

  let updates = req.body.photo
    ? {
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
        photo: req.body.photo,
      }
    : {
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
      };

  // oldData fetch
  const oldDataDoc = await User.findOne({ _id: userProfile._id, removed: false }).lean();
  if (!oldDataDoc) {
    return throwDBResourceNotFoundError(res, `Profile by this id ${userProfile._id}`);
  }

  // update document
  const result = await User.findOneAndUpdate(
    { _id: userProfile._id, removed: false },
    { $set: updates },
    { new: true }
  ).lean(); // lean() ensures we get plain JS object

  // Activity Tracker logging with full snapshots
  activityTracker({
    userId: req.admin._id,
    companyId: req.admin.companyId,
    plantId: req.admin.plantId || null,
    module: MODULE.middlewares,
    subModuleAffected: SUBMODULE.createUser,
    fileAffected: FILE.file_createUser_updateProfile,
    modelAffected: [MODEL_AFFECTED.model_user],
    eventType: USER_PROFILE_UPDATED,
    actionDone: ACTIONS.update,
    oldData: oldDataDoc,  // full old document
    newData: result,      // full updated document
    description: `Profile updated by ${getFullName(req.admin.employeeInfo)} for ${getFullName(userProfile.employeeInfo)} whose user Id: ${userProfile._id}`
  });

  return res.status(200).json({
    success: true,
    result: {
      _id: result?._id,
      enabled: result?.enabled,
      email: result?.email,
      name: result?.name,
      surname: result?.surname,
      photo: result?.photo,
      role: result?.role,
    },
    message: 'we update this profile by this id: ' + userProfile._id,
  });
};

module.exports = updateProfile;