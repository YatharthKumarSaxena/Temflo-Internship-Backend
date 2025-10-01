const { OK } = require("@/config/httpStatus.config");
const { PLANT_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

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

    // Activity Tracker logging
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
      description: `Plant with code '${oldPlant.plantCode}' was updated by ${getFullName(req.admin.employeeInfo)}.`,
      oldData: oldPlant.toObject(),   // complete old snapshot
      newData: { ...oldPlant.toObject(), ...updateData } // complete new snapshot
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldPlant.toObject(), ...updateData },
      message: 'Plant updated successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Plant 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;
