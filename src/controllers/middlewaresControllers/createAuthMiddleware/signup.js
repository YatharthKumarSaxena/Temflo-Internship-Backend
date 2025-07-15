const { generate: uniqueId } = require('shortid');
const mongoose = require('mongoose');


const signUp = async (req, res, { userModel }) => {
    try {
        const Admin = mongoose.model(userModel);
        const AdminPassword = mongoose.model(userModel + 'Password');

        const { email,password,code,name,address,city,state,country,pinCode,phoneNumber } = req.body;

        if(!email || !password || !code || !name || !address || !city || !state || !country || !pinCode || !phoneNumber) {
            return res.status(400).json({ success:false, message: 'All fields required' });
 
        }
        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ success:false, message: 'Email already exists' });
        }

        // Create salt and hash password
        const newAdminPassword = new AdminPassword();
        const salt = uniqueId();
        const passwordHash = newAdminPassword.generateHash(salt, password);

        // Create admin user
        const newadmin = {
            email,
            code,
            name,
            cAddress:address,
            city,
            state,
            country,
            pinCode,
            phoneNumber,
            enabled: true,
            role: 'owner',
        };
        const adminResult = await new Admin(newadmin).save();

        // Save password in AdminPassword model
        const adminPasswordData = {
            password: passwordHash,
            emailVerified: true,
            salt,
            user: adminResult._id,
        };
        await new AdminPassword(adminPasswordData).save();

        res.status(201).json({ message: 'Admin created successfully', adminId: adminResult._id, success:true });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = signUp;
