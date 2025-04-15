const { company } = require("@/locale/translation/en_us");

const read = async (Model, req, res) => {
    // Find document by id
    const result = await Model.findOne({
      _id: req.params.id,
      company:req.admin.id,
      removed: false,
    })
      .populate('company')
      .exec();
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No Business Area found ',
      });
    } else {
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'We found this Business Area ',
      });
    }
  };
  
  module.exports = read;
  