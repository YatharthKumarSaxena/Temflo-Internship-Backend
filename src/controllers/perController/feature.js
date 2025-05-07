
const feature = async (Model, req, res) => {

    const {features} = req.body

     if (!Array.isArray(features)) {
        return res.status(400).json({ success: false, message: 'enter a valid features format' });
    }

     
    try {
    const user = await Model.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.permissions = features

    await user.save();

    res.status(200).json({
      success: true,
      message: `Permission(s) added successfully`,
      permissions: user.permissions,
    });
  } catch (err) {
    console.error('Error adding permissions:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
    
  };
  
  module.exports = feature;
  