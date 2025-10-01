const UserModel = require("@/models/userModels/User");
const { COMPANY_DETAILS_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError, throwMissingFieldsError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');
const { employeeTemplate } = require("@/config/emailTemplates/employeeTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

const updateCompanyDetails = async (req, res) => {
  try {
    const id = req.admin._id; // Admin ID
    const companyId = req.admin.companyId;

    const {
      legalStatus,
      tan,
      pan,
      year,
      name,
      address,
      city,
      state,
      country,
      pinCode,
      phoneNumber
    } = req.body;

    // ⚡ Single query: update + old doc return
    const oldAdmin = await UserModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        legalStatus,
        tan,
        pan,
        year,
        name,
        address,
        city,
        state,
        country,
        pinCode,
        phoneNumber,
      },
      { new: false } // 👈 returns OLD document (before update)
    );

    if (!oldAdmin) {
      return throwDBResourceNotFoundError(res, "Admin");
    }

    logWithTime(`✅ 🎯 Company Details Updated Successfully 🚀`);

    // Complete snapshot of old data
    const oldData = { ...oldAdmin.toObject() };

    // New data from request body (already updated in DB)
    const newData = { ...oldAdmin.toObject(), ...req.body };

  // After activityTracker logging, before return response
if (req.admin.email) { // ensure admin email exists
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const profileLink = `${baseUrl}/profile`; // link to admin's profile

  const emailConfig = {
    ...employeeTemplate.companyDetailsUpdated,
    user_name: req.admin.name || "Admin",
    action_cta: "Please visit your profile to verify the updated details.",
    actionbutton_text: "Go to Profile",
    actionlink: profileLink,
    action_link: profileLink,
  };

  const html = generateMasterTemplate(emailConfig);
  sendEmail(req.admin.email, emailConfig.subject, html); // fire-and-forget
}
    // Activity Tracker logging
    activityTracker({
      userId: id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: oldAdmin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.setting,
      fileAffected: FILE.file_setting_updateCompanyDetails,
      modelAffected: [MODEL_AFFECTED.model_user],
      eventType: COMPANY_DETAILS_UPDATED,
      actionDone: ACTIONS.update,
      description: `${getFullName(req.admin.employeeInfo)} has updated the company details`,
      oldData: oldData,
      newData: newData
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldAdmin.toObject(), ...newData }, // response me updated data bhejna
      message: 'Company details updated successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update the company details 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = updateCompanyDetails;