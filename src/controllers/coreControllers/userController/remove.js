const mongoose = require('mongoose');

const remove= async ( req, res) => {
    try {
      const User = mongoose.model('User');
      const  id  = req.admin.companyId; 
       
      const updatedBusinessArea = await User.findOneAndUpdate(
          { _id: req.params.id, companyId: id }, 
          { removed:true },                
          { new: true }                   
        );
  
      if (!updatedBusinessArea) {
        return res.status(404).json({
          success: false,
          message: 'User not found or you do not have access to delete this user.',
        });
      }
  
  
      return res.status(200).json({
        success: true,
        message: 'User Deleted successfully',
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
  