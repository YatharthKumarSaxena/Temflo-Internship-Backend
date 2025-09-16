const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_REMOVED,SUBTASK_DELETED } = require("@/config/activity.enums");
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const remove = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    const Subtask = mongoose.model('Subtask');
    const User = mongoose.model('User');

    // 🔹 Fetch Task
    const task = await Task.findOne({ _id: req.params.taskId, removed: false });
    if (!task) {
      return res.status(404).json({ success: false, message: 'No Task Found To Delete' });
    }

    const previousAssignedTo = task.assignedTo;

    // 🔹 Fetch Subtasks
    const subtasks = await Subtask.find({ taskId: task._id, removed: false });

    // 🔹 Soft delete Subtasks
    for (const subtask of subtasks) {
      subtask.removed = true;
          // ✅ Activity Tracker logging
          await activityTracker({
            userId: req.admin._id,
            companyId: req.admin.companyId,
            plantId: req.admin.plantId || null,
            module: MODULE.taskManager,
            subModuleAffected: SUBMODULE.task,
            fileAffected: FILE.file_remove_task,
            modelAffected: [MODEL_AFFECTED.model_subtask],
            eventType: SUBTASK_DELETED,
            actionDone: ACTIONS.delete,
            oldData: subtask.toObject(),
            newData: {
              note: "Soft delete performed",
              removed: true
            }
          }),
      await subtask.save();
    }

    // 🔹 Soft delete Task
    task.removed = true;
    await task.save();

    // 🔹 Activity Tracker
    await activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.task,
      fileAffected: FILE.file_remove_task,
      modelAffected: [MODEL_AFFECTED.model_task],
      eventType: TASK_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: task.toObject(),
      newData: { note: "Soft deletion performed", removed: true }
    });

    // 🔹 Email to previously assigned user
    if (previousAssignedTo) {
      const assignedUser = await User.findById(previousAssignedTo);
      if (assignedUser?.email) {
        const html = generateMasterTemplate({
          company_name: req.admin.companyName,
          user_name: assignedUser.name,
          event_name: masterTemplate.taskUnassignedFromEmployee.event_name,
          action: masterTemplate.taskUnassignedFromEmployee.action,
          status: 'Removed',
          message_intro: masterTemplate.taskUnassignedFromEmployee.message_intro,
          notes: `
            Task Title: ${task.title}<br/>
            Removed By: ${req.admin.name}<br/>
            Date: ${new Date().toLocaleString()}
          `
        });
        sendEmail(assignedUser.email, masterTemplate.taskUnassignedFromEmployee.subject, html);
      }
    }

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