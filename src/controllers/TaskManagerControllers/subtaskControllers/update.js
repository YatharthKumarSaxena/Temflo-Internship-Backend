const mongoose = require('mongoose');

const update = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');

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
      comment,
    } = req.body;

    const subtask = await Subtask.findOne({ _id: req.params.subtaskId });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Update',
      });
    }

    if (title) subtask.title = title;
    if (description) subtask.description = description;
    if (status) subtask.status = status;
    if (priority) subtask.priority = priority;
    if (assignedTo) subtask.assignedTo = assignedTo;
    if (dueDate) subtask.dueDate = dueDate;
    if (links) subtask.links = links;
    if (tags) subtask.tags = tags;
    if (storyPointEstimate) subtask.storyPointEstimate = storyPointEstimate;
    if (comment) {
      const prevComments = subtask.comments;
      if (prevComments) {
        const newComments = [...prevComments, comment];
        subtask.comments = newComments;
      } else {
        subtask.comments = [comment];
      }
    }

    await subtask.save();

    return res.status(200).json({
      success: true,
      message: 'Subtask Updated Successfully',
    });
  } catch (error) {
    console.error('Subtask Updation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = update;
