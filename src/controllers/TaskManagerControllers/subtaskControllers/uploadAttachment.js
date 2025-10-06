const mongoose = require('mongoose');
const upload = require('@/services/file-upload');
const fs = require('fs');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { SUBTASK_ATTACHMENT_ADDED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const uploadAttachment = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');

    // 🔹 Check if subtask exists
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

    // 🔹 Save full snapshot of subtask before change
    const oldSnapshot = subtask.toObject();

    // 🔹 Handle file upload via multer
    const uploadMiddleware = upload.single('subtaskAttachment');
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      try {
        // 🔹 Create attachment object
        const attachment = {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: req.admin._id,
          uploadedAt: new Date(),
        };

        // 🔹 Add attachment to subtask
        subtask.attachments.push(attachment);
        await subtask.save();

        // 🔹 Save full snapshot after change
        const newSnapshot = subtask.toObject();

        // 🔹 Activity Tracker logging with full snapshot
        activityTracker({
          userId: req.admin._id,
          companyId: req.admin.companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.taskManager,
          subModuleAffected: SUBMODULE.subtask,
          fileAffected: FILE.file_subtask_attachment_uploaded,
          modelAffected: [MODEL_AFFECTED.model_subtask],
          eventType: SUBTASK_ATTACHMENT_ADDED,
          actionDone: ACTIONS.create,
          oldData: oldSnapshot,
          newData: newSnapshot,
          description: `New attachment added to subtask by ${getFullName(req.admin.employeeInfo)}`
        });

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          attachment: attachment,
        });
      } catch (error) {
        // 🔹 Clean up uploaded file if save fails
        if (req.file?.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
          });
        }

        console.error('Subtask attachment upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    });
  } catch (error) {
    console.error('Subtask attachment upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = uploadAttachment;