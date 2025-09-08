const mongoose = require('mongoose');
const upload = require('@/services/file-upload');
const fs = require('fs');
const path = require('path');

const uploadAttachment = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');
    
    // Check if subtask exists
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

    // Use multer middleware to handle file upload
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

        // Add attachment to subtask
        subtask.attachments.push(attachment);
        await subtask.save();

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
