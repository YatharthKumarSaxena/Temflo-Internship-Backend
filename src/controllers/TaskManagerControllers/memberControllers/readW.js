const mongoose = require('mongoose');

const readW = async (req, res) => {
  try {
    const Member = mongoose.model('Member');

    const { workspaceId } = req.body;

    if (workspaceId) {
      const member = await Member.find({ workspaceId, removed: false }).populate('userId')
      if (!member) {
        return res.status(404).json({
          success: false,
          member: null,
          message: 'No Member found',
        });
      } else {
        return res.status(200).json({
          success: true,
          member,
          message: 'We found these Member',
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'workspaceId field required' });
    }
    
  } catch (error) {
    console.error('Member Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = readW;
