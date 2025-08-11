const UserModel = require('../../../models/userModels/User');

class UpdateController {
  updateInfo = async (req, res, next) => {
    try {
      // Check the type and get _id accordingly
      const _id = req.admin.id;
      const { firstName, middleName, lastName, bloodGroup, gender, dob, mobile, emailPersonal } =
        req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, companyId: req.admin.companyId },
        {
          $set: {
            'employeeInfo.firstName': firstName,
            'employeeInfo.middlename': middleName,
            'employeeInfo.lastName': lastName,
            'employeeInfo.bloodGroup': bloodGroup,
            'employeeInfo.gender': gender,
            'employeeInfo.dob': dob,
            'employeeInfo.emailPersonal': emailPersonal,
            mobile: mobile,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updateAddress = async (req, res, next) => {
    try {
      const _id = req.admin.id;

      const { permanentAddress, presentAddress } = req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, companyId: req.admin.companyId },
        {
          $set: {
            'address.permanentAddress.address': permanentAddress.address,
            'address.permanentAddress.country': permanentAddress.country,
            'address.permanentAddress.state': permanentAddress.state,
            'address.permanentAddress.city': permanentAddress.city,
            'address.presentAddress.address': presentAddress.address,
            'address.presentAddress.country': presentAddress.country,
            'address.presentAddress.state': presentAddress.state,
            'address.presentAddress.city': presentAddress.city,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updateEmergencyContact = async (req, res, next) => {
    try {
      const _id = req.admin.id;

      const { name, address, number, email } = req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, comapanyId: req.admin.companyId },
        {
          $set: {
            'emergencyContact.name': name,
            'emergencyContact.address': address,
            'emergencyContact.number': number,
            'emergencyContact.email': email,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error updating employee information',
        error: error.message,
      });
    }
  };

  updateBankDetail = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin.id;

      const { accountNumber, bankName, ifscCode, accountType, accountHolder } = req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, comapanyId: req.admin.companyId },
        {
          $set: {
            'bankDetail.accountNumber': accountNumber,
            'bankDetail.bankName': bankName,
            'bankDetail.ifscCode': ifscCode,
            'bankDetail.accountType': accountType,
            'bankDetail.accountHolder': accountHolder,
            'bankDetail.document': filename,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updateDegreeInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin.id;

      const { degree, institute, year, percentage } = req.body;

      if (!degree || !institute || !year || !percentage || !file)
        return res.status(404).json({ success: false, message: 'All field requireed' });

      const user = await UserModel.findOne({ _id, companyId: req.admin.companyId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Destructure the degree fields from the request body
      const newDegree = {
        degree,
        institute,
        year,
        percentage,
        document: filename, // Add file path (if uploaded)
      };

      // Push new degree to the degreeInfo array
      user.degreeInfo.push(newDegree);

      // Save the updated user information
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Degree information updated successfully',
        degreeInfo: user.degreeInfo,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updateExperienceInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin.id;

      const { company, position, dateOfEntry, dateOfExit } = req.body;

      if (!company || !position || !dateOfEntry || !dateOfExit || !file)
        return res.status(404).json({ success: false, message: 'All field requireed' });

      const user = await UserModel.findOne({ _id, companyId: req.admin.companyId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Destructure the degree fields from the request body
      const newExperience = {
        company,
        position,
        dateOfEntry,
        dateOfExit,
        document: filename, // Add file path (if uploaded)
      };

      // Push new degree to the degreeInfo array
      user.experience.push(newExperience);

      // Save the updated user information
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Experience information updated successfully',
        experienceInfo: user.experience,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updatePan = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      if (!file) return res.status(404).json({ success: false, message: 'All field required' });

      const _id = req.admin.id;

      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, companyId: req.admin.companyId },
        {
          $set: {
            'panaddhar.panCard': filename,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };

  updateAadhar = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      if (!file) return res.status(404).json({ success: false, message: 'All field Required' });

      const _id = req.admin.id;
      const updatedUser = await UserModel.findByIdAndUpdate(
        { _id, companyId: req.admin.companyId },
        {
          $set: {
            'panaddhar.aadharCard': filename,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: updatedUser,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating employee information' });
    }
  };
}

module.exports = new UpdateController();
