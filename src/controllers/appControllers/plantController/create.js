const { OK } = require("@/config/httpStatus.config");
const { PLANT_CREATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwConflictError } = require("@/config/error-handler.config");
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
      description: `Plant with Code '${result.plantCode}' created successfully by ${getFullName(req.admin.employeeInfo)}`,
      oldData: null,
      newData: result
    });

    const User = mongoose.model('User')
    const owner = await User.findOne({ companyId, role: "owner", removed: false });

    if (owner) {
      sendEmail(
        owner.email,
        appTemplate.plantCreation.subject,
        generateMasterTemplate({
          ...appTemplate.plantCreation,
          user_name: getFullName(owner.name)

        })
      );
    }

    if (req.body.email) {
      sendEmail(
        req.body.email,
        appTemplate.plantCreation.subject,
        generateMasterTemplate({
          ...appTemplate.plantCreation,
          user_name: req.body.name,
          message_intro: `A new plant has been created using your Email ID for the company ${req.admin.name}`
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