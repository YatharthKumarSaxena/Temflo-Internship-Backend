const { OK } = require("@/config/httpStatus.config");
const { GSTIN_CREATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const create = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId; // Company ID from admin token

    // Creating a new document in the collection
    req.body.removed = false;
    const result = await new Model({
      ...req.body,
      companyId: companyId
    }).save();

    logWithTime(`✅ 🎯 GSTIN Number created Successfully 🚀`);

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.gstinNumber,
      fileAffected: FILE.file_gstinNumber_create,
      modelAffected: [MODEL_AFFECTED.model_gstinNumber],
      eventType: GSTIN_CREATED,
      actionDone: ACTIONS.create,
      description: `GSTIN Number created by ${getFullName(req.admin.employeeInfo)} for Company ID: ${req.admin.companyId}`,
      oldData: null,
      newData: result
    });

    // Returning successfull response
    return res.status(OK).json({
      success: true,
      result,
      message: 'Successfully Created the document in Model ',
    });

  } catch (err) {
    logWithTime(`❌ Internal Error: Failed to create document in Model ⚠️`);
    errorMessage(err);
    return throwInternalServerError(res);
  }
};

module.exports = create;