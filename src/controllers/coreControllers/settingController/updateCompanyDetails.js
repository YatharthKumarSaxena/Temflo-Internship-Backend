
const Admin = require("../../../models/coreModels/Admin")

const updateCompanyDetails= async (req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    const {
      legalStatus,
      tan,
      pan,
      year,
    } = req.body;

    const checkIsDetailUpdated = await Admin.findById(id);

    if(checkIsDetailUpdated.isDetailUpdated){

        return res.status(404).json({
            success: false,
            message: 'Details already Up to Date. You can not update right now.',
          });

    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      {
        legalStatus,
        tan,
        pan,
        year,
        isDetailUpdated:true
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
