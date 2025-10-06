const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_UPDATED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const update = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const Member = mongoose.model('Member');

    if (req.admin.role != 'employee') {
      return res.status(404).json({
        success: false,
        message: 'You are not an employee',
      });
    }

    const subtask = await Subtask.findOne({
      _id: req.params.subtaskId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'No Subtask found To Update',
      });
    }

    const response = await Member.findOne({
      userId: req.admin.id,
      projectId: subtask.projectId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'No Subtask found',
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

    const subtaskOldData = { ...subtask.toObject() };

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

    const oldObj = subtaskOldData;
    const newObj = subtask.toObject();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.employeeSubtask,
      fileAffected: FILE.file_employee_subtask_update,
      modelAffected: [MODEL_AFFECTED.model_subtask],
      eventType: SUBTASK_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldObj,
      newData: newObj,
      description: `Subtask updated by ${getFullName(req.admin.employeeInfo)}`
    });


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