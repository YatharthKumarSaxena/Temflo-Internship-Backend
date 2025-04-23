const remove= async (Model, req, res) => {
    try {
      
      const  id  = req.admin.companyId;  
      const permission = await Model.findOneAndDelete({ _id: req.params.id, companyId: id });
  
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found. ',
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Permission Deleted successfully',
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
  