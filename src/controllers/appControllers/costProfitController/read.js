
const read = async (Model, req, res) => {
    // Find document by id
    const result = await Model.findOne({
      _id: req.params.id,
      companyId:req.admin.companyId,
      removed: false,
    })
      .exec();
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No Cost/Profit Center found ',
      });
    } else {
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'We found this Cost/Profit Center ',
      });
    }
  };
  
  module.exports = read;
  