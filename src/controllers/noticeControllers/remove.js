const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { NOTICE_REMOVED } = require("@/config/activity.enums");

const remove = async (req, res) => {
  try {
    const Notice = mongoose.model('Notice');
    const companyId = req.admin.companyId;
    const noticeId = req.params.noticeId;      // ID of the parent Policy document

    // 1. Fetch the document containing the notice
    const noticeDoc = await Notice.findOne({ companyId });
    if (!noticeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found or you do not have access to delete this entry.',
      });
    }
    
    // 2. Extract oldData
    const oldData = noticeDoc.notices.find(n => n._id.toString() === noticeId);

    const updatedNotice = await Notice.findOneAndUpdate(
      { companyId: companyId },
      { $pull: { notices: { _id: noticeId } } },
      { new: true }
    );

    if (!updatedNotice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found or you do not have access to delete this entry.',
      });
    }

    // --- Activity Tracker 
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.notice,
      subModuleAffected: null,
      fileAffected: FILE.file_notice_remove,
      modelAffected: [MODEL_AFFECTED.model_notice],
      eventType: NOTICE_REMOVED,
      actionDone: ACTIONS.delete,
      oldData: oldData,
      newData: {
        deletedNoticeId: req.params.noticeId,
        note: "All fields same as Old Data, Soft deletion is Done",
        removed: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Notice  entry deleted successfully',
      notice: updatedNotice.notices
    });
  } catch (error) {
    console.error('Delete Notice Entry Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }

};

module.exports = remove;