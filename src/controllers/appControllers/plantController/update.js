const { OK } = require("@/config/httpStatus.config");
const { PLANT_UPDATED } = require("@/config/activity.enums");
const {
  errorMessage,
  throwInternalServerError,
  throwDBResourceNotFoundError,
} = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const {
  MODEL_AFFECTED,
  MODULE,
  SUBMODULE,
  ACTIONS,
  FILE,
} = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { appTemplate } = require("@/config/emailTemplates/appTemplates");
const { sendEmail } = require("@/utils/emailSender");
const mongoose = require("mongoose");

const update = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId;

    const updateData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      phone: req.body.phone,
      email: req.body.email,
    };

    // return old document (new: false)
    const oldPlant = await Model.findOneAndUpdate(
      { _id: req.params.id, companyId },
      updateData,
      { new: false }
    );

    if (!oldPlant) {
      return throwDBResourceNotFoundError(res, "Plant");
    }

    logWithTime(`✅ 🎯 Plant Updated Successfully 🚀`);

    // 📧 Check if email has changed
    const oldEmail = oldPlant.email;
    const newEmail = updateData.email;

    const plantDetails = `
    Plant Code: ${oldPlant.plantCode || "N/A"}
    Name      : ${oldPlant.name || "N/A"}
    Address   : ${oldPlant.address || "N/A"}, ${oldPlant.city || "N/A"}, ${oldPlant.state || "N/A"} - ${oldPlant.postalCode || "N/A"}, ${oldPlant.country || "N/A"}
    Phone     : ${oldPlant.phone || "N/A"}
    Email     : ${oldPlant.email || "N/A"}`;

    if (oldEmail && newEmail && oldEmail !== newEmail) {
      try {
        const User = mongoose.model("User");
        const owner = await User.findOne({
          companyId,
          role: "owner",
          removed: false,
        });

        // Send email to new email
        if (newEmail) {
          sendEmail(
            newEmail,
            appTemplate.plantUpdation.subject,
            generateMasterTemplate({
              ...appTemplate.plantUpdation,
              user_name: "User",
              message_intro: `A plant has been updated using your Email ID for the company ${req.admin.name}`,
              notes: plantDetails
            })
          );
        }

        // Send email to owner
        if (owner) {
          sendEmail(
            owner.email,
            appTemplate.plantUpdation.subject,
            generateMasterTemplate({
              ...appTemplate.plantUpdation,
              user_name: getFullName(owner.employeeInfo),
              message_intro: `A plant with email '${oldEmail}' was updated to '${newEmail}' for company ${req.admin.name}`,
              notes: plantDetails
            })
          );
        }
      } catch (e) {
        logWithTime("⚠️ Email send failed during plant update:", e.message);
      }
    }

    // 📜 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.plant,
      fileAffected: FILE.file_plant_update,
      modelAffected: [MODEL_AFFECTED.model_plant],
      eventType: PLANT_UPDATED,
      actionDone: ACTIONS.update,
      description: `Plant with code '${oldPlant.plantCode}' was updated by ${req.admin.name}.`,
      oldData: oldPlant.toObject(),
      newData: { ...oldPlant.toObject(), ...updateData },
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldPlant.toObject(), ...updateData },
      message: "Plant updated successfully",
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Plant 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;
