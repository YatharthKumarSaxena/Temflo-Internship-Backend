const update= async (Model, req, res) => {
  try {
    const  id  = req.admin._id; // Admin ID passed in URL
    const {
      description
    } = req.body;

    const updatedBusinessArea = await Model.findOneAndUpdate(
        { _id: req.params.id, company: id }, 
        { description },                
        { new: true }                   
      );

    if (!updatedBusinessArea) {
      return res.status(404).json({
        success: false,
        message: 'Business Area not found or you do not have access to this business area.',
      });
    }


    return res.status(200).json({
      success: true,
      result: updatedBusinessArea,
      message: 'Business Area updated successfully',
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
