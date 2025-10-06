const mongoose = require('mongoose');
const upload = require('@/services/file-upload');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { TASK_ATTACHMENT_ADDED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const uploadAttachment = async (req, res) => {
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

    const uploadMiddleware = upload.single('taskAttachment');
    
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
        const attachment = {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: req.admin._id,
          uploadedAt: new Date(),
        };

        const oldSnapshot = task.toObject();
        task.attachments.push(attachment);
        await task.save();
        const newSnapshot = task.toObject();

        // 🔹 Activity Tracker logging
        activityTracker({
          userId: req.admin._id,
          companyId: req.admin.companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.taskManager,
          subModuleAffected: SUBMODULE.task,
          fileAffected: FILE.file_task_attachment_uploaded,
          modelAffected: [MODEL_AFFECTED.model_task],
          eventType: TASK_ATTACHMENT_ADDED,
          actionDone: ACTIONS.create,
          oldData: oldSnapshot,
          newData: newSnapshot,
          description: `Attachment uploaded by ${getFullName(req.admin.employeeInfo)}`
        });

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          attachment: attachment,
        });
      } catch (error) {
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
          });
        }
        
        console.error('Task attachment upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    });
  } catch (error) {
    console.error('Task attachment upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = uploadAttachment;