const mongoose = require('mongoose');

const read = async (req, res) => {
  try {
    const Member = mongoose.model('Member');

    const { projectId } = req.body;

    if (projectId) {
      const member = await Member.find({ projectId, removed: false }).populate('userId')
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
      return res.status(400).json({ success: false, message: 'projectId field required' });
    }
    
  } catch (error) {
    console.error('Member Reading Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = read;
