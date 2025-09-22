const Notice = require('../../models/coreModels/Notice')
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { NOTICE_UPDATED, NOTICE_CREATED } = require("@/config/activity.enums");

class UpdateController{

    updateNotice = async (req, res, next) => {
    try {
    const file = req.file;
    const filename = req.file.path;

    const { description, publishedDate } = req.body;

    if (!description || !publishedDate || !file) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newNoticeEntry = {
      description,
      publishedDate,
      file: filename,
    };

    let notice = await Notice.findOne({ companyId: req.admin.companyId });

    if (notice) {
      // Policy document found — push into array
      const oldData = JSON.parse(JSON.stringify(notice.notices));
      notice.notices.push(newNoticeEntry);
      await notice.save();

      // 5️⃣ Activity Tracker logging
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notice,
        subModuleAffected: null,
        fileAffected: FILE.file_notice_update,
        modelAffected: [MODEL_AFFECTED.model_notice],
        eventType: NOTICE_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldData,
        newData: newNoticeEntry
      });

      return res.status(200).json({
        success: true,
        message: 'Notice updated successfully',
        notice: notice.notices
      });
    } else {
      // Policy document not found — create a new one
      notice = new Notice({
        companyId: req.admin.companyId,
        notices: [newNoticeEntry]
      });

      await notice.save();

      // 5️⃣ Activity Tracker logging
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.notice,
        subModuleAffected: null,
        fileAffected: FILE.file_notice_update,
        modelAffected: [MODEL_AFFECTED.model_notice],
        eventType: NOTICE_CREATED,
        actionDone: ACTIONS.create,
        oldData: null,
        newData: newNoticeEntry
      });

      return res.status(201).json({
        success: true,
        message: 'Notice created and notice entry added',
        notice: notice.notices
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error processing notice' });
  }

}

}


module.exports = new UpdateController();