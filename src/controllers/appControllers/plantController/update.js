const update= async (Model, req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    const {
      name,address,city,state,postalCode,country,phone,email
    } = req.body;

    const updatedBusinessArea = await Model.findOneAndUpdate(
        { _id: req.params.id,companyId:req.admin.companyId }, 
        { name,address,city,state,postalCode,country,phone,email },                
        { new: true }                   
      );

    if (!updatedBusinessArea) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found or you do not have access to this Plant.',
      });
    }


    return res.status(200).json({
      success: true,
      result: updatedBusinessArea,
      message: 'Plant updated successfully',
    });
  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;
