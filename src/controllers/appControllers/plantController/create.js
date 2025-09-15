const { company } = require('@/locale/translation/en_us');
const mongoose = require('mongoose');

const create = async (Model, req, res) => {
  // Creating a new document in the collection
  req.body.removed = false;

  const existing = await Model.findOne({
    plantCode: req.body.plantCode,
    companyId: req.admin.companyId,
    removed: false,
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Plant with this code already exists for your company.',
    });
  }

  // If country is not provided, attempt to default it from the Company master
  try {
    if (!req.body.country && req.admin?.companyId) {
      const Company = mongoose.model('Company');
      const companyDoc = await Company.findById(req.admin.companyId).lean();
      if (companyDoc?.country) {
        req.body.country = companyDoc.country;
      }
    }
  } catch (e) {
    // Non-blocking: if company not found, proceed without defaulting
  }

  const result = await new Model({
    ...req.body,
    companyId: req.admin.companyId,
  }).save();

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully Created the Plant in Model ',
  });
};

module.exports = create;
