const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_UPDATED } = require("@/config/activity.enums");

const update = async (req, res) => {
  // params TaskId
  try {
    const Task = mongoose.model('Task');
    const Member = mongoose.model('Member');

    if (req.admin.role != 'employee') {
      return res.status(404).json({
        success: false,
        message: 'You are not an employee',
      });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        task: null,
        message: 'No Task Found To Update',
      });
    }

    const taskOldData = { ...task.toObject() };

    const response = await Member.findOne({
      userId: req.admin.id,
      projectId: task.projectId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'No Task Found To Update',
      });
    }

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

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;
    if (links) task.links = links;
    if (tags) task.tags = tags;
    if (storyPointEstimate) task.storyPointEstimate = storyPointEstimate;
    console.log('first', comment);
    if (comment) {
      const prevComments = task.comments;
      if (prevComments) {
        const newComments = [...prevComments, comment];
        task.comments = newComments;
      } else {
        task.comments = [comment];
      }
    }

    await task.save();

    const changedOldData = {};
const changedNewData = {};
const oldObj = taskOldData;
const newObj = task.toObject();

for (let key in newObj) {
  if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
    changedOldData[key] = oldObj[key];
    changedNewData[key] = newObj[key];
  }
}


    activityTracker({
  userId: req.admin._id,
  companyId: req.admin.companyId,
  plantId: req.admin.plantId || null,
  module: MODULE.taskManager,
  subModuleAffected: SUBMODULE.employeeTask,
  fileAffected: FILE.file_employee_task_update, // Ensure this is defined
  modelAffected: [MODEL_AFFECTED.model_task],
  eventType: TASK_UPDATED,
  actionDone: ACTIONS.update,
oldData: changedOldData,
newData: changedNewData
});

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