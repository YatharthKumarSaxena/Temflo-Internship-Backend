const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const deleteAttachment = async (req, res) => {
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

    // Find the attachment to delete
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

    // Delete the file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
      }
    });

    // Remove attachment from subtask
    subtask.attachments.splice(attachmentIndex, 1);
    await subtask.save();

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
