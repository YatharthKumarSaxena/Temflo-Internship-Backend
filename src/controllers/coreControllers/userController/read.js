const { company } = require("@/locale/translation/en_us");
const mongoose = require('mongoose');

const read = async (req, res) => {
    // Find document by id
    const User = mongoose.model('User');
    const result = await User.findOne({
      _id: req.params.id,
      companyId:req.admin.companyId,
      removed: false,
      role: { $in: ['admin', 'employee']},
    }).populate('plantId')
      .exec();
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No User found ',
      });
    } else {
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'We found this User ',
      });
    }
  };
  
  module.exports = read;
  