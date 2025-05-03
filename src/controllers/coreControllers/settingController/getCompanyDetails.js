const User = require("../../../models/userModels/User")

const getCompanyDetails = async (req,res) => {
    try{
        const result = await User.findOne({
    _id: req.admin.id,
    removed: false,
  }).exec();
  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    // Return success resposne
    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document ',
    });
  }


    }catch (error) {
    console.error('Get Company Detail :', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

module.exports = getCompanyDetails  