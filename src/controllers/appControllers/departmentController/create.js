const { company } = require("@/locale/translation/en_us");
const { OK } = require("@/config/httpStatus.config");
const { DEPARTMENT_CREATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const create = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId; // Company ID from admin token
    // Creating a new document in the collection
    req.body.removed = false;
    const result = await new Model({
      ...req.body,
      companyId: companyId
    }).save();

    logWithTime(`✅ 🎯 Department Created Successfully 🚀`);

    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.department,
      fileAffected: FILE.file_department_create,
      modelAffected: [MODEL_AFFECTED.model_department],
      eventType: DEPARTMENT_CREATED,
      actionDone: ACTIONS.create,
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
    logWithTime(`❌ Internal Error: Failed to create Department ⚠️`);
    errorMessage(err);
    return throwInternalServerError(res);
  }

};

module.exports = create;