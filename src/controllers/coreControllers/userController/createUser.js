const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { USER_CREATED } = require("@/config/activity.enums");

const createUser = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    const {email,password,employeeCode,name,plantId,mobile} = req.body
    
    if(!email || !password || !employeeCode || !name || !plantId || !mobile) {
            return res.status(400).json({ success:false, message: 'All fields required' });
    }

    const existingEmpId = await User.findOne({ employeeCode,companyId:req.admin.companyId,removed:false });
        if (existingEmpId) {
            return res.status(400).json({ success:false, message: 'Employee Code already exists' });
        }

    const existingUser = await User.findOne({ email,companyId:req.admin.companyId,removed:false });
        if (existingUser) {
            return res.status(400).json({ success:false, message: 'Email already exists' });
        }
    
    const deletedUser = await User.findOne({ email,companyId:req.admin.companyId,removed:true });
        if (deletedUser) {
            return res.status(400).json({ success:false, message: 'User with this email is removed, contact adminstrator' });
    } 

    // Create salt and hash password
    const newUserPassword = new UserPassword();
    const salt = uniqueId();
    const passwordHash = await newUserPassword.generateHash(salt, password);

    const newuser={
        email,employeeCode,companyId:req.admin.companyId,name,plantId,mobile,role:"employee"
    }

    const userResult = await new User(newuser).save();
    const userPasswordData = {
        password:passwordHash,
        emailVerified:true,
        salt,
        user:userResult._id
    }
    await new UserPassword(userPasswordData).save();
    // Activity Tracker logging
    activityTracker({
      userId: req.admin._id, // admin ka Mongo ID as userId
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.core,
      subModuleAffected: SUBMODULE.user,
      fileAffected: FILE.file_user_createUser,
      modelAffected: [MODEL_AFFECTED.model_user, MODEL_AFFECTED.model_userPassword],
      eventType: USER_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: {
        user: userResult
      }
    });
    
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