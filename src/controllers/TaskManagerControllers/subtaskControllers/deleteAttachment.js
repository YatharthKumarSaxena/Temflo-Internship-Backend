const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_ATTACHMENT_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const deleteAttachment = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');

    // 1️⃣ Check if subtask exists
    const subtask = await Subtask.findOne({
      _id: req.params.subtaskId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    // 2️⃣ Save full old snapshot
    const oldSnapshot = subtask.toObject();

    // 3️⃣ Find the attachment to delete
    const attachmentIndex = subtask.attachments.findIndex(
      attachment => attachment._id.toString() === req.params.attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const attachment = subtask.attachments[attachmentIndex];

    // 4️⃣ Delete the file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
      }
    });

    // 5️⃣ Remove attachment from subtask
    subtask.attachments.splice(attachmentIndex, 1);
    await subtask.save();

    // 6️⃣ Save new snapshot after deletion
    const newSnapshot = subtask.toObject();

    // 7️⃣ Activity Tracker logging with full snapshots
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.subtask,
      fileAffected: FILE.file_subtask_attachment_deleted,
      modelAffected: [MODEL_AFFECTED.model_subtask],
      eventType: SUBTASK_ATTACHMENT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: oldSnapshot,
      newData: newSnapshot,
      description: `Attachment deleted from subtask by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Subtask attachment deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = deleteAttachment;