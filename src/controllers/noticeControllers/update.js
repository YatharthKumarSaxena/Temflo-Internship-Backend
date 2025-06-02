const Notice = require('../../models/coreModels/Notice')

class UpdateController{

    updateNotice = async (req, res, next) => {
    try {
    const file = req.file;
    const filename = file && file.filename;

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
      notice.notices.push(newNoticeEntry);
      await notice.save();

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