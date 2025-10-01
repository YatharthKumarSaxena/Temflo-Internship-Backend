const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_DELETED } = require("@/config/activity.enums");
const { taskManagerTemplate } = require("@/config/emailTemplates/taskManagerTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const remove = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    const User = mongoose.model('User'); // ✅ For email

    const subtask = await Subtask.findOne({ _id: req.params.subtaskId, removed: false });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'No Subtask Found To Delete',
      });
    }

    // Soft delete
    subtask.removed = true;
    await subtask.save();

    // ✅ Activity Tracker logging
    await activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.subtask,
      fileAffected: FILE.file_subtask_delete,
      modelAffected: [MODEL_AFFECTED.model_subtask],
      eventType: SUBTASK_DELETED,
      actionDone: ACTIONS.delete,
      oldData: subtask.toObject(),
      newData: {
        note: "Soft delete performed",
        removed: true
      },
    });

    // 🔹 Email Notification (if assignedTo exists)
    if (subtask.assignedTo) {
      const assignedUser = await User.findById(subtask.assignedTo);
      if (assignedUser && assignedUser.email) {
        const emailHtml = generateMasterTemplate({
          company_name: req.admin.companyName,
          user_name: assignedUser.name,
          event_name: taskManagerTemplate.subtaskRemovedFromEmployee.event_name,
          action: taskManagerTemplate.subtaskRemovedFromEmployee.action,
          status: 'Removed',
          message_intro: `A subtask assigned to you has been removed.`,
          notes: `
            Subtask Title: ${subtask.title}<br/>
            Task ID: ${subtask.taskId}<br/>
            Project ID: ${subtask.projectId}<br/>
            Removed By: ${req.admin.name}<br/>
            Date: ${new Date().toLocaleString()}
          `
          // ✅ No action button/link sent
        });

        sendEmail(assignedUser.email, taskManagerTemplate.subtaskRemovedFromEmployee.subject, emailHtml);
      }
    }

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
