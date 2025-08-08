const GSTModel = require("../../../models/appModels/GstinNumber");

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

    // 2. Check uniqueness of business area
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

    // 3. Save new entry
    req.body.removed = false;
    const result = await new Model({
      ...req.body,
      companyId,
    }).save();
    
    await result.populate('gstinNumber');
    



    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully Added Business Area',
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + err.message,
    });
  }
};

module.exports = create;
