const { company } = require("@/locale/translation/en_us");
const { OK } = require("@/config/httpStatus.config");
const { PLANT_CREATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwConflictError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const create = async (Model, req, res) => {
  try {
    const companyId = req.admin.companyId; // Company ID from admin token

    // Creating a new document in the collection
    req.body.removed = false;

    const existing = await Model.findOne({ plantCode: req.body.plantCode, companyId: companyId, removed: false });

    if (existing) {
      return throwConflictError(res, 'Plant with this code already exists for your company.');
    }
  } catch (e) {
    // Non-blocking: if company not found, proceed without defaulting
  }

    const result = await new Model({
      ...req.body,
      companyId: req.admin.companyId
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
      oldData: null,
      newData: result
    });

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