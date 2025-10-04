const { BUSINESS_SEGMENT_CREATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const create = async (Model, req, res) => {
  try {
    const { segmentCode, description } = req.body;
    const companyId = req.admin.companyId;

    // Validate segmentCode → 1-5 alphanumeric characters (letters and/or digits)
    if (!segmentCode || !/^[A-Za-z0-9]{1,5}$/.test(segmentCode)) {
      return res.status(400).json({
        success: false,
        message: 'Business Segment Code must be 1-5 letters and/or digits.',
      });
    }

    // Validate description → must be a non-empty string
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be a non-empty string.',
      });
    }

    req.body.removed = false;

    // Create the new business segment
    const result = await new Model({
      ...req.body,
      companyId,
    }).save();

    // ---- ACTIVITY TRACKER ----
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.app,
      subModuleAffected: SUBMODULE.business_segment,
      fileAffected: FILE.file_businessSegment_create,
      modelAffected: [MODEL_AFFECTED.model_businessSegment],
      eventType: BUSINESS_SEGMENT_CREATED,
      actionDone: ACTIONS.create,
      oldData: null, // ✅ Correct for creation
      newData: result.toObject(), // ✅ Complete snapshot
      description: `Business segment '${segmentCode}' created by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(201).json({
      success: true,
      result,
      message: 'Successfully Added Business Segment',
    });
  } catch (error) {
    console.error('Error adding Business Segment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = create;
