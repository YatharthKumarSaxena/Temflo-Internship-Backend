const update= async (Model, req, res) => {
    try {
      const  id  = req.admin.companyId; // Admin ID passed in URL
      const {
        stateCode,gstinNumber
      } = req.body;
  
      const updatedBusinessArea = await Model.findOneAndUpdate(
          { _id: req.params.id, companyId: id }, 
          { stateCode,gstinNumber },                
          { new: true }                   
        );
  
      if (!updatedBusinessArea) {
        return res.status(404).json({
          success: false,
          message: 'GSTIN Number not found or you do not have access to this GSTIN Number.',
        });
      }
  
  
      return res.status(200).json({
        success: true,
        result: updatedBusinessArea,
        message: 'GSTIN Number updated successfully',
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
  