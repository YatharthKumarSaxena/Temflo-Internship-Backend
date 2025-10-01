const { BUSINESS_AREA_CREATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const create = async (Model, req, res) => {
  // Creating a new document in the collection
  req.body.removed = false;
  const result = await new Model({
    ...req.body,
    companyId: req.admin.companyId
  }).save();

  // ✅ Activity Tracker logging (added only, no structural change)
  activityTracker({
    userId: req.admin._id, 
    companyId: req.admin.companyId,
    plantId: req.admin.plantId || null,
    module: MODULE.app,
    subModuleAffected: SUBMODULE.business,
    fileAffected: FILE.file_business_create,
    modelAffected: [MODEL_AFFECTED.model_company],
    eventType: BUSINESS_AREA_CREATED,
    actionDone: ACTIONS.create,
    description: `Business Area created by ${getFullName(req.admin.employeeInfo)} for Company ID: ${req.admin.companyId}`,
    oldData: null,   // abhi optional rakha hai
    newData: result  // abhi ke liye add kar diya
  });

  // Returning successful response
  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully Created the document in Model ',
  });
};

module.exports = create;