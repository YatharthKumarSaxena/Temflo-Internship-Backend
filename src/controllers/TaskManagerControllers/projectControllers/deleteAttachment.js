const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PROJECT_ATTACHMENT_DELETED } = require("@/config/activity.enums");
const { getFullName } = require("@/utils/commonFunctions");

const deleteAttachment = async (req, res) => {
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

    // Find the attachment to delete
    const attachmentIndex = project.attachments.findIndex(
      attachment => attachment._id.toString() === req.params.attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const attachment = project.attachments[attachmentIndex];

    // Delete the file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
      }
    });

    const oldAttachments = [...project.attachments]; // before removal

    // Remove attachment
    project.attachments.splice(attachmentIndex, 1);
    await project.save();

    const newAttachments = [...project.attachments]; // after removal

    // 🔹 Activity Tracker logging
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || project.plantId || null,
      module: MODULE.taskManager,
      subModuleAffected: SUBMODULE.project,
      fileAffected: FILE.file_project_attachment_deleted, // ensure defined in your FILE config
      modelAffected: [MODEL_AFFECTED.model_project],
      eventType: PROJECT_ATTACHMENT_DELETED,
      actionDone: ACTIONS.delete,
      oldData: oldAttachments,
      newData: newAttachments,
      description: `Attachment deleted from project by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Project attachment deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = deleteAttachment;