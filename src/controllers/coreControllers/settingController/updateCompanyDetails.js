
const User = require("../../../models/userModels/User")

const updateCompanyDetails= async (req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    const {
      legalStatus,
        tan,
        pan,
        year,
        name,
        address,
        city,
        state,
        country,
        pinCode,
        phoneNumber
    } = req.body;

   

    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      {
        legalStatus,
        tan,
        pan,
        year,
        name,
        address,
        city,
        state,
        country,
        pinCode,
        phoneNumber
        
      },
      { new: true } // Return the updated document
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }


    return res.status(200).json({
      success: true,
      result: updatedAdmin,
      message: 'Company details updated successfully',
    });
  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = updateCompanyDetails;
