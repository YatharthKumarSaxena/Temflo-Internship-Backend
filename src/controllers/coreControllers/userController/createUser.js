const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');

const createUser = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    const {email,password,employeeCode} = req.body
    
    if(!email || !password || !employeeCode) {
            return res.status(400).json({ success:false, message: 'All fields required' });
    }

    const existingEmpId = await User.findOne({ employeeCode,companyId:req.admin.companyId });
        if (existingEmpId) {
            return res.status(400).json({ success:false, message: 'Employee Code already exists' });
        }

    const existingUser = await User.findOne({ email,companyId:req.admin.companyId });
        if (existingUser) {
            return res.status(400).json({ success:false, message: 'Email already exists' });
        }
    
    // Create salt and hash password
    const newUserPassword = new UserPassword();
    const salt = uniqueId();
    const passwordHash = newUserPassword.generateHash(salt, password);

    const newuser={
        email,employeeCode,companyId:req.admin.companyId
    }

    const userResult = await new User(newuser).save();
    const userPasswordData = {
        password:passwordHash,
        emailVerified:true,
        salt,
        user:userResult._id
    }
    await new UserPassword(userPasswordData).save();

    return res.status(200).json({
      success: true,
      message: 'User Created Successfully',
    });
  } catch (error) {
    console.error('User Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createUser;
