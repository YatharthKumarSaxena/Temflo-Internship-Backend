const mongoose = require('mongoose');
const { ACCOUNT_ACTIVATED, ACCOUNT_DEACTIVATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');
const { employeeTemplate } = require("@/config/emailTemplates/employeeTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const remove = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const companyId = req.admin.companyId;
    const id = req.params.id;
    
    const {removed} = req.body;
    if (typeof removed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'activate (true/false) must be provided in body',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }


    const newRemovedStatus = removed;

    const oldData = user;

    user.removed = newRemovedStatus;
    await user.save();

    if(removed){
      const emailConfig = {
        ...employeeTemplate.accountStatusChange,
        user_name: getFullName(user.employeeInfo) || "User",
        status: "Deactivated",
        message_intro: "Your Account is deactivated by Admin",
        notes: "You will not be able to log in until your account is reactivated. For assistance, please contact support."
      };
      const html = generateMasterTemplate(emailConfig);
      sendEmail(user.email, emailConfig.subject, html); // fire-and-forget
    }else{
      const emailConfig = {
        ...employeeTemplate.accountStatusChange,
        user_name: getFullName(user.employeeInfo) || "User",
        status: "Activated",
        message_intro: "Your Account is now reactivated by Admin",
        notes: "You can now log in and access all features of the platform."
      };
      const html = generateMasterTemplate(emailConfig);
      sendEmail(user.email, emailConfig.subject, html); // fire-and-forget
    }

    let event,action;
    if(removed){
      event = ACCOUNT_DEACTIVATED;
      action = ACTIONS.delete;
    }
    else{
      event = ACCOUNT_ACTIVATED;
      action = ACTIONS.create;
    }
    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.user,
      fileAffected: FILE.file_user_remove,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: event,
      actionDone: action,
      oldData: oldData,
      newData: {
        removed: removed
      }
    });

    return res.status(OK).json({
      success: true,
      message: `User ${!removed ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to Deactivate/Activate User 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = remove;