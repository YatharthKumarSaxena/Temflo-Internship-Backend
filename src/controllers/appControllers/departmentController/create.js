const { CREATED } = require("@/config/httpStatus.config");
const { DEPARTMENT_CREATED } = require("@/config/activity.enums");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const create = async (Model, req, res) => {
  try {
    const { departmentCode, description } = req.body;
    const companyId = req.admin.companyId;

    // Validate departmentCode → 1-6 alphanumeric characters (letters and/or digits)
    if (!departmentCode || !/^[A-Za-z0-9]{1,6}$/.test(departmentCode)) {
      return res.status(400).json({
        success: false,
        message: 'Department Code must be 1-6 letters and/or digits.',
      });
    }

    // Validate description → must be a non-empty string
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be a non-empty string.',
      });
    }

    // Check if department already exists in the same company
    const existing = await Model.findOne({
      departmentCode,
      companyId,
      removed: { $ne: true }, // ensure not soft-deleted
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists in the company.',
      });
    }

    req.body.removed = false;

    // Create the new department
    const result = await new Model({
      ...req.body,
      companyId,
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
      description: `Department created by ${getFullName(req.admin.employeeInfo)} for Company ID: ${req.admin.companyId}`,
      oldData: null, // ✅ Correct for creation 
      newData: result.toObject() // ✅ Complete snapshot
    });

    // Returning successful response
    return res.status(CREATED).json({
      success: true,
      result,
      message: 'Successfully Added Department',
    });

  } catch (error) {
    console.error('Error adding Department:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = create;
