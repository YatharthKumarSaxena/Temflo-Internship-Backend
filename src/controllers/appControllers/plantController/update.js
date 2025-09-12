const { OK } = require("@/config/httpStatus.config");
const { PLANT_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");

const update = async (Model, req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    
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

    // old document return hoga (new: false)
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
      oldData: {
        _id: req.params.id,
        name: oldPlant.name,
        address: oldPlant.address,
        city: oldPlant.city,
        state: oldPlant.state,
        postalCode: oldPlant.postalCode,
        country: oldPlant.country,
        phone: oldPlant.phone,
        email: oldPlant.email
      },
      newData: updateData
    });

    return res.status(OK).json({
      success: true,
      result: { ...oldPlant.toObject(), ...updateData }, // old ke sath updated data merge karke bhej diya
      message: 'Plant updated successfully',
    });
  } catch (error) {
    logWithTime("❌ Internal Error: Failed to update Plant 🗑️");
    errorMessage(error);
    return throwInternalServerError(res);
  }
};

module.exports = update;