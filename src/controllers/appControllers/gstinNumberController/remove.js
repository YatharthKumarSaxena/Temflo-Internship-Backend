const remove= async (Model, req, res) => {
    try {
      const  id  = req.admin.companyId; 
       
      const updatedBusinessArea = await Model.findOneAndUpdate(
          { _id: req.params.id, companyId: id }, 
          { removed:true },                
          { new: true }                   
        );
  
      if (!updatedBusinessArea) {
        return res.status(404).json({
          success: false,
          message: 'GSTIN Number not found or you do not have access to delete this GSTIN Number.',
        });
      }
  
  
      return res.status(200).json({
        success: true,
        message: 'GSTIN Number Deleted successfully',
      });
    } catch (error) {
      console.error('Update Admin Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
  
  module.exports = remove;
  