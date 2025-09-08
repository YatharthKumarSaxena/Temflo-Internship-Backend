const mongoose = require('mongoose');

const remove = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');

    const subtask = await Subtask.findOne({ _id: req.params.subtaskId, removed: false });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'No Subtask Found To Delete',
      });
    }
    
    subtask.removed = true;
    await subtask.save();

    return res.status(200).json({
      success: true,
      message: 'Subtask Deleted Successfully',
    });
  } catch (error) {
    console.error('Subtask Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
