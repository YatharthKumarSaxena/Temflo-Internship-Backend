
const Admin = require("../../../models/coreModels/Admin")

const updateManySetting = async (req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    const {
      address,
      city,
      state,
      country,
      pinCode,
      phoneNumber
    } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      {
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
      message: 'Admin contact details updated successfully',
    });
  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = updateManySetting;
