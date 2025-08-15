const mongoose = require('mongoose');

const remove = async (req, res) => {
  // params TaskId
  try {
    const Task = mongoose.model('Task');

    const task = await Task.findOne({ _id: req.params.taskId, removed: false });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Delete',
      });
    }
    
    // To Delete Task
    task.removed = true;
    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task Deleted Successfully',
    });
  } catch (error) {
    console.error('Task Deletion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = remove;
