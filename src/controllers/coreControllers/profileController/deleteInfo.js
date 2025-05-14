const mongoose = require('mongoose');


const deleteInfo = async (req, res, next) => {
    const { infoType, deleteId } = req.params;
    const User = mongoose.model('User');

    // Validate infoType
    const allowedTypes = ['degreeInfo', 'experience'];
    if (!allowedTypes.includes(infoType)) {
        return res.status(400).json({ message: 'Invalid Url to delete' });
    }

    try {
    // Pull the item from the specified array
    const result = await User.findOneAndUpdate(
      { _id: req.admin.id, [`${infoType}._id`]: deleteId }, // Check existence
      { $pull: { [infoType]: { _id: deleteId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'} not found` });
    }

    res.status(200).json({ message: `${infoType === 'degreeInfo' ? 'Degree' : 'Experience'} deleted successfully`, data: result });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
    

   
};

module.exports = deleteInfo;
