const mongoose = require('mongoose');

const remove= async ( req, res) => {
    try {
  const Notice = mongoose.model('Notice');
  const companyId = req.admin.companyId;
  const noticeId = req.params.noticeId;      // ID of the parent Policy document

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
  