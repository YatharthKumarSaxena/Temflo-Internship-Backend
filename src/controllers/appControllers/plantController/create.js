const { OK } = require("@/config/httpStatus.config");
const { PLANT_CREATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { appTemplate } = require("@/config/emailTemplates/appTemplates");
const mongoose = require("mongoose");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");

const create = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId; // Company ID from admin token

    const existing = await Model.findOne({
      plantCode: req.body.plantCode,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Plant with this code already exists for your company.',
      });
    }

    // If country is not provided, attempt to default it from the Company master
    try {
      if (!req.body.country && req.admin?.companyId) {
        const Company = mongoose.model('Company');
        const companyDoc = await Company.findById(req.admin.companyId).lean();
        if (companyDoc?.country) {
          req.body.country = companyDoc.country;
        }
      }
    } catch (e) {
      // Non-blocking: if company not found, proceed without defaulting
    }

    const result = await new Model({
      ...req.body,
      companyId: req.admin.companyId,
    }).save();

    logWithTime(`✅ 🎯 Plant Created Successfully 🚀`);
    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.plant,
      fileAffected: FILE.file_plant_create,
      modelAffected: [MODEL_AFFECTED.model_plant],
      eventType: PLANT_CREATED,
      actionDone: ACTIONS.create,
      description: `Plant with Code '${result.plantCode}' created successfully by ${req.admin.name}`,
      oldData: null, // ✅ Correct for creation
      newData: result.toObject() // ✅ Complete snapshot
    });

    const User = mongoose.model('User')
    const owner = await User.findOne({ companyId, role: "owner", removed: false });

    const plantDetails = `
    Plant Code: ${result.plantCode || "N/A"}
    Name      : ${result.name || "N/A"}
    Address   : ${result.address || "N/A"}, ${result.city || "N/A"}, ${result.state || "N/A"} - ${result.postalCode || "N/A"}, ${result.country || "N/A"}
    Phone     : ${result.phone || "N/A"}
    Email     : ${result.email || "N/A"}`;


    if (owner) {
      sendEmail(
        owner.email,
        appTemplate.plantCreation.subject,
        generateMasterTemplate({
          ...appTemplate.plantCreation,
          user_name: getFullName(owner.employeeInfo),
          message_intro: `A new plant with code '${result.plantCode}' has been created in your company ${req.admin.name}`,
          notes: plantDetails
        })
      );
    }

    if (req.body.email) {
      sendEmail(
        req.body.email,
        appTemplate.plantCreation.subject,
        generateMasterTemplate({
          ...appTemplate.plantCreation,
          user_name: "User",
          message_intro: `A new plant has been created using your Email ID for the company ${req.admin.name}`,
          notes: plantDetails
        })
      );
    }

    // Returning successfull response
    return res.status(OK).json({
      success: true,
      result,
      message: 'Successfully Created the Plant in Model ',
    });

  } catch (err) {
    logWithTime(`❌ Internal Error: Failed to create plant in Model ⚠️`);
    errorMessage(err);
    return throwInternalServerError(res);
  }
}
module.exports = create;