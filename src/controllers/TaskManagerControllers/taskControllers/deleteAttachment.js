const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_ATTACHMENT_DELETED } = require("@/config/activity.enums");

const deleteAttachment = async (req, res) => {
  try {
    const Task = mongoose.model('Task');
    
    // Check if task exists
    const task = await Task.findOne({
      _id: req.params.taskId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Find the attachment to delete
    const attachmentIndex = task.attachments.findIndex(
      attachment => attachment._id.toString() === req.params.attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const attachment = task.attachments[attachmentIndex];

    // Delete the file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
      }
    });

    // Remove attachment from task
    task.attachments.splice(attachmentIndex, 1);
    await task.save();

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.task,
      fileAffected: FILE.file_task_attachment_deleted,
      modelAffected: [MODEL_AFFECTED.model_task],
      eventType: TASK_ATTACHMENT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: attachment,
      newData: {
        note: "This Attachment deleted successfully"
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Task attachment deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = deleteAttachment;