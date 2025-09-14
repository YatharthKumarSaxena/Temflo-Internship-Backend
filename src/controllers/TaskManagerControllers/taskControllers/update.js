const mongoose = require('mongoose');

const update = async (req, res) => {
  // params TaskId
  try {
    const Task = mongoose.model('Task');

    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      links,
      tags,
      storyPointEstimate,
      comment
    } = req.body;

    const task = await Task.findOne({ _id: req.params.taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Update',
      });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;
    if (links) task.links = links;
    if (tags) task.tags = tags;
    if (storyPointEstimate) task.storyPointEstimate = storyPointEstimate;
    console.log("first",comment)
    if (comment) {
      const prevComments = task.comments;
      if (prevComments) {
        const newComments = [...prevComments, comment];
        task.comments = newComments;
      } else {
        task.comments = [comment]
      }
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task Updated Successfully',
    });
  } catch (error) {
    console.error('Task Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;