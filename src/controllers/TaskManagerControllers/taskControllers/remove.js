const mongoose = require('mongoose');

const remove = async (req, res) => {
  // params TaskId
  try {
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');

    const task = await Task.findOne({ _id: req.params.taskId, removed: false });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Delete',
      });
    }

    const subtasks = await Subtask.find({ taskId: req.params.taskId, removed: false });

    // To Delete Subtask
    subtasks?.map(async (subtaskId) => {
        const subtask = await Task.findOne({_id:subtaskId})
        subtask.removed = true
        await subtask.save()
    })
    
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