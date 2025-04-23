
const create = async (Model, req, res) => {

  const { employeeId, plantId, features } = req.body;

  try {
    
    // Check if permission already exists
    const existingPermission = await Model.findOne({ employeeId, plantId, companyId:req.admin.companyId });
    if (existingPermission) {
      return res.status(400).json({ success:false,message: 'Permission already exists for this employee in this plant' });
    }

    // Create new permission
    const newPermission = new Model({
      employeeId,
      plantId,
      companyId:req.admin.companyId,
      features
    });

    await newPermission.save();

    res.status(201).json({ success:true,message: 'Permission created successfully', permission: newPermission });

  } catch (err) {
    console.error('Error creating permission:', err);
    res.status(500).json({success:false, message: 'Server error' });
  }


};

module.exports = create;
