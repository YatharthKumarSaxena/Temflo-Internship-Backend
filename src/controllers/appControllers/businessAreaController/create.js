const GSTModel = require('../../../models/appModels/GstinNumber');
const { BUSINESS_AREA_CREATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

const create = async (Model, req, res) => {
  try {
    const { gstinNumber, businessArea } = req.body;
    const companyId = req.admin?.companyId;

    // 1. Check GSTIN existence
    const gstRecord = await GSTModel.findOne({
      _id: gstinNumber,
      companyId,
    });

    if (!gstRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN: GSTIN is not registered in the database.',
      });
    }

    // 2. Validate Business Area → must be exactly 4 digits
    if (!businessArea || !/^\d{4}$/.test(businessArea)) {
      return res.status(400).json({
        success: false,
        message: 'Business Area Code must contain 4 digits.',
      });
    }

    // 3. Check uniqueness of business area
    const existingBusinessArea = await Model.findOne({
      businessArea,
      companyId,
      removed: false,
    });

    if (existingBusinessArea) {
      return res.status(400).json({
        success: false,
        message: 'Business Area already exists for this company.',
      });
    }

    // 4. Save new entry
    req.body.removed = false;
    const result = await new Model({
      ...req.body,
      companyId,
    }).save();

    await result.populate('gstinNumber');

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
      oldData: null, // ✅ Correct for creation
      newData: result.toObject() // ✅ Complete snapshot
    });

    // Returning successful response
    return res.status(201).json({
      success: true,
      result,
      message: 'Successfully added the Business Area',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + err.message,
    });
  };
}

module.exports = create;