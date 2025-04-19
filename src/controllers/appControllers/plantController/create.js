const { company } = require("@/locale/translation/en_us");

const create = async (Model, req, res) => {
  // Creating a new document in the collection
  req.body.removed = false;
  console.log(req.admin.companyId)
  const result = await new Model({
    ...req.body,
    companyId:req.admin.companyId
  }).save();

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully Created the Plant in Model ',
  });
};

module.exports = create;
