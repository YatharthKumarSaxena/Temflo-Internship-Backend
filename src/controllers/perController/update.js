const update = async (Model, req, res) => {
    try {
      const  id  = req.admin.companyId; 
      const { features } = req.body;
       
      const permission = await Model.findOneAndUpdate(
          { _id: req.params.id, companyId: id }, 
          { features },                
          { new: true }                   
        );
  
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found.',
        });
      }
  
  
      return res.status(200).json({
        success: true,
        message: 'Permission Updated successfully',
        permission

      });
    } catch (error) {
      console.error('Update Permission Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
  
  module.exports = update;
  