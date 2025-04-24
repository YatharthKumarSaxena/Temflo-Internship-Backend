const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');
const xlsx = require('xlsx');
const fs = require('fs');

const createBulk = async (req, res) => {
  try {
    const User = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'Excel file is required' });

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets['Employees'];
    const employeesData = xlsx.utils.sheet_to_json(sheet);

    const companyId = req.admin.companyId;
    const emails = employeesData.map(emp => emp.Email?.toLowerCase());
    const employeeCodes = employeesData.map(emp => emp.EmployeeID);

    const existingUsers = await User.find({
      companyId,
      $or: [
        { email: { $in: emails } },
        { employeeCode: { $in: employeeCodes } },
      ]
    });

    const existingEmailSet = new Set(existingUsers.map(u => u.email));
    const existingCodeSet = new Set(existingUsers.map(u => u.employeeCode));

    const success = [];
    const duplicates = [];
    const failed = [];

    for (const emp of employeesData) {
      const email = emp.Email?.toLowerCase();
      const employeeCode = emp.EmployeeID;

      if (!email || !emp.Password || !employeeCode) {
        failed.push({ ...emp, reason: 'Missing required fields' });
        continue;
      }

      if (existingEmailSet.has(email) || existingCodeSet.has(employeeCode)) {
        duplicates.push({ ...emp, reason: 'Duplicate email or employeeCode' });
        continue;
      }

      try {
        const salt = uniqueId();
        const userPassword = new UserPassword();
        const passwordHash = userPassword.generateHash(salt, emp.Password.toString());

        const newUser = new User({
          email,
          employeeCode,
          companyId,
          name: emp.Name,
          type: emp.Type?.toLowerCase(),
        });

        const savedUser = await newUser.save();

        const userPasswordData = new UserPassword({
          password: passwordHash,
          emailVerified: true,
          salt,
          user: savedUser._id
        });

        await userPasswordData.save();
        success.push({ email, employeeCode });

        existingEmailSet.add(email);
        existingCodeSet.add(employeeCode);

      } catch (err) {
        failed.push({ ...emp, reason: err.message });
      }
    }

    fs.unlinkSync(file.path); // Cleanup file

    return res.status(200).json({
      success: true,
      message: 'Bulk user upload complete',
      logs: {
        created: success,
        duplicates,
        failed
      }
    });
  } catch (error) {
    console.error('User Creation In Bulk Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = createBulk;
