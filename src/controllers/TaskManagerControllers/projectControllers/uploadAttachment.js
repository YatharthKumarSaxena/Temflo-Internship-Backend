const mongoose = require('mongoose');
const upload = require('@/services/file-upload');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PROJECT_ATTACHMENT_ADDED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const uploadAttachment = async (req, res) => {
  try {
    const Project = mongoose.model('Project');
    
    // Check if project exists
    const project = await Project.findOne({
      _id: req.params.projectId,
      companyId: req.admin.companyId,
      removed: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Use multer middleware to handle file upload
    const uploadMiddleware = upload.single('projectAttachment');
    
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
        // Create attachment object
        const attachment = {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: req.admin.id,
          uploadedAt: new Date(),
        };

        const oldSnapshot = project.toObject(); // full old project snapshot
        project.attachments.push(attachment);
        await project.save();
        const newSnapshot = project.toObject(); // full new snapshot

        // 🔹 Activity Tracker logging
        activityTracker({
          userId: req.admin._id,
          companyId: req.admin.companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.taskManager,
          subModuleAffected: SUBMODULE.project,
          fileAffected: FILE.file_project_attachment_uploaded, // define in your FILE config
          modelAffected: [MODEL_AFFECTED.model_project],
          eventType: PROJECT_ATTACHMENT_ADDED,
          actionDone: ACTIONS.create,
          oldData: oldSnapshot,
          newData: newSnapshot,
          description: `New attachment added to project by ${getFullName(req.admin.employeeInfo)}`
        });

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          attachment: attachment,
        });
      } catch (error) {
        // Clean up uploaded file if database save fails
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
          });
        }
        
        console.error('Project attachment upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    });
  } catch (error) {
    console.error('Project attachment upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = uploadAttachment;