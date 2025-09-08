const mongoose = require('mongoose');

const createWorkspace = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const { name, description, plantId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const workspace = new Workspace({
      name,
      description,
      companyId: req.admin.companyId,
      plantId,
      createdBy: req.admin.id,
    });
    await workspace.save();

    return res.status(200).json({
      success: true,
      message: 'Workspace Created Successfully',
    });
  } catch (error) {
    console.error('Workspace Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createWorkspace;
