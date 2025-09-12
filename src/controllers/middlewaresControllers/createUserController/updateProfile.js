const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_PROFILE_UPDATED } = require("@/config/activity.enums");
const { throwDBResourceNotFoundError } = require("@/config/error-handler.config");

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
  ).exec();

  const oldData = {
    _id: userProfile._id,
    email: oldDataDoc.email,
    name: oldDataDoc.name,
    surname: oldDataDoc.surname,
    photo: oldDataDoc.photo || null,
  };

  const newData = {
    email: result.email,
    name: result.name,
    surname: result.surname,
    photo: result.photo || null,
  };

  // Activity Tracker logging
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
    oldData,
    newData,
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