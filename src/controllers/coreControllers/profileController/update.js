const UserModel = require('../../../models/userModels/User')
const { PROFILE_UPDATED, PAN_UPDATED, AADHAR_UPDATED, ADDRESS_UPDATED, BANK_DETAIL_UPDATED, EMERGENCY_CONTACT_UPDATED, DEGREE_ADDED, EXPERIENCE_ADDED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError, throwMissingFieldsError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');
const { getFullName } = require("@/utils/commonFunctions");

class UpdateController {

  updateInfo = async (req, res, next) => {
    try {
      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const updateData = {
        mobile: req.body.contactNumber,
        "employeeInfo.firstName": req.body.firstName,
        "employeeInfo.middleName": req.body.middleName,
        "employeeInfo.lastName": req.body.lastName,
        "employeeInfo.bloodGroup": req.body.bloodGroup,
        "employeeInfo.gender": req.body.gender,
        "employeeInfo.dob": req.body.dob,
        "employeeInfo.emailPersonal": req.body.emailPersonal,
        "employeeInfo.department": req.body.department,
        "employeeInfo.dateOfJoining": req.body.dateOfJoining,
        "employeeInfo.designation": req.body.designation,
        // "employeeInfo.supervisor": req.body.supervisor
      };

      // 🔑 Single query: update + return old doc
      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: updateData },
        { new: false }
      );

      if (!oldUser) {
        return throwDBResourceNotFoundError(res, "Employee");
      }

      logWithTime(`✅ 🎯 Employee Information Updated Successfully 🚀`);

      const oldData = {
        ...oldUser.employeeInfo.toObject(),
        mobile: oldUser.mobile,
      };

      // Merge old info + incoming update
      const effectiveEmployeeInfo = {
        ...oldUser.employeeInfo.toObject(), // old data
        ...req.body,                        // overwrite with updated fields
      };

      const newData = effectiveEmployeeInfo;

      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: PROFILE_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Personal Information`,
        oldData,
        newData,
      });

      return res.status(OK).json({
        success: true,
        message: "Employee information updated successfully",
        employee: { ...oldUser.toObject(), ...updateData }, // merge old with updated
      });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Employee Information 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  // ✅ Update Address
  updateAddress = async (req, res, next) => {
    try {
      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const { permanentAddress, presentAddress } = req.body;

      const updateData = {
        "address.permanentAddress.address": permanentAddress.address,
        "address.permanentAddress.country": permanentAddress.country,
        "address.permanentAddress.state": permanentAddress.state,
        "address.permanentAddress.city": permanentAddress.city,
        "address.presentAddress.address": presentAddress.address,
        "address.presentAddress.country": presentAddress.country,
        "address.presentAddress.state": presentAddress.state,
        "address.presentAddress.city": presentAddress.city,
      };

      // Single DB call → update + return old data
      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: updateData },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee Address Updated Successfully 🚀`);

      const oldData = {
        permanentAddress: oldUser.address.permanentAddress,
        presentAddress: oldUser.address.presentAddress,
      };

      const newData = {
        ...oldUser.address, // old data
        ...req.body                     // overwrite updated fields
      };

      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: ADDRESS_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Address`,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Employee information updated successfully",
        employee: { ...oldUser.toObject(), address: newData }
      });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update address of Employee 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  // ✅ Update Emergency Contact
  updateEmergencyContact = async (req, res, next) => {
    try {
      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const { name, address, number, email } = req.body;

      const updateData = {
        "emergencyContact.name": name,
        "emergencyContact.address": address,
        "emergencyContact.number": number,
        "emergencyContact.email": email,
      };

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: updateData },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee Emergency Contact Updated Successfully 🚀`);

      const oldData = { ...oldUser.emergencyContact.toObject() };
      const newData = {
        ...oldUser.emergencyContact, // old data
        ...req.body                     // overwrite updated fields
      };

      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: EMERGENCY_CONTACT_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Emergency Contact`,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Employee information updated successfully",
        employee: { ...oldUser.toObject(), emergencyContact: newData }
      });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update emergency contact 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  // ✅ Update Bank Detail
  updateBankDetail = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const { accountNumber, bankName, ifscCode, accountType, accountHolder } = req.body;

      const updateData = {
        "bankDetail.accountNumber": accountNumber,
        "bankDetail.bankName": bankName,
        "bankDetail.ifscCode": ifscCode,
        "bankDetail.accountType": accountType,
        "bankDetail.accountHolder": accountHolder,
        "bankDetail.document": filename,
      };

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: updateData },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee Bank Detail Updated Successfully 🚀`);

      const oldData = oldUser.bankDetail ? { ...oldUser.bankDetail.toObject() } : {};

      const newData = {
        ...oldUser.bankDetail.toObject?.() || {},
        accountNumber,
        bankName,
        ifscCode,
        accountType,
        accountHolder,
        document: filename
      };

      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: BANK_DETAIL_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Bank Details`,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Employee information updated successfully",
        employee: { ...oldUser.toObject(), bankDetail: newData }
      });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update bank details 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  updateDegreeInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const { degree, institute, year, percentage } = req.body;

      if (!degree || !institute || !year || !percentage || !file)
        return throwMissingFieldsError(res, "All fields");

      const user = await UserModel.findOne({ _id, companyId });

      if (!user) {
        return throwDBResourceNotFoundError(res, "User");
      }

      const newDegree = {
        degree,
        institute,
        year,
        percentage,
        document: filename,
      };

      // DB update in one go
      await UserModel.updateOne(
        { _id, companyId },
        { $push: { degreeInfo: newDegree } }
      );

      const oldUser = user;  

      const oldData = { degreeInfo: oldUser.degreeInfo.slice() };
      const newData = { degreeInfo: [...oldUser.degreeInfo, newDegree] };

      logWithTime(`✅ 🎯 Employee Degree Information Updated Successfully 🚀`);

      // Activity Tracker logging
      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: user.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: DEGREE_ADDED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her degree`,
        oldData,
        newData,
      });

      return res.status(OK).json({
        success: true,
        message: "Degree information updated successfully",
        degreeInfo: newData.degreeInfo, // direct newData bhej diya
      });
    } catch (error) {
      logWithTime(
        "❌ Internal Error: Failed to update Degree Information of Employee 🗑️"
      );
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  updateExperienceInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const { company, position, dateOfEntry, dateOfExit } = req.body;

      if (!company || !position || !dateOfEntry || !dateOfExit || !file)
        return throwMissingFieldsError(res, "All fields");

      const user = await UserModel.findOne({ _id, companyId });

      if (!user) {
        return throwDBResourceNotFoundError(res, "User");
      }

      const newExperience = {
        company,
        position,
        dateOfEntry,
        dateOfExit,
        document: filename,
      };

      // DB update in one go
      await UserModel.updateOne(
        { _id, companyId },
        { $push: { experience: newExperience } }
      );

      const oldUser = user; 

      const oldData = { experience: oldUser.experience.slice() };
      const newData = { experience: [...oldUser.experience, newExperience] };

      logWithTime(`✅ 🎯 Employee Experience Information Updated Successfully 🚀`);

      // Activity Tracker logging
      activityTracker({
        userId: _id,
        companyId: companyId,
        plantId: user.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: EXPERIENCE_ADDED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her experience`,
        oldData,
        newData,
      });

      return res.status(OK).json({
        success: true,
        message: "Experience information updated successfully",
        experience: newData.experience,
      });
    } catch (error) {
      logWithTime(
        "❌ Internal Error: Failed to update Experience Information of Employee 🗑️"
      );
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  // ✅ Update PAN
  updatePan = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      if (!file) return throwMissingFieldsError(res, "All fields");

      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      const updateData = { "panaddhar.panCard": filename };

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: updateData },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee PAN Information Updated Successfully 🚀`);

      const oldData = { panCard: oldUser.panaddhar?.panCard || null };
      const newData = {
        panCard: filename
      };

      activityTracker({
        userId: _id,
        companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: PAN_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Pan Information`,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Employee information updated successfully",
        employee: { ...oldUser.toObject(), panaddhar: newData }
      });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update PAN 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  updateAadhar = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = req.file.path;

      if (!file) return throwMissingFieldsError(res, "All fields");

      const _id = req.admin._id;
      const companyId = req.admin.companyId;

      // ⚡ Single query: update + old data return
      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        {
          $set: {
            "panaddhar.aadharCard": filename,
          },
        },
        { new: false } // 👈 returns OLD document
      );

      if (!oldUser) {
        return throwDBResourceNotFoundError(res, "Employee");
      }

      logWithTime(`✅ 🎯 Employee Aadhar Information Updated Successfully 🚀`);

      const oldData = { aadharCard: oldUser.panaddhar?.aadharCard || null };
      const newData = {
        aadharCard: filename
      };

      // Activity Tracker logging
      activityTracker({
        userId: _id, // admin ka Mongo ID as userId
        companyId: companyId,
        plantId: oldUser.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: AADHAR_UPDATED,
        actionDone: ACTIONS.update,
        description: `${getFullName(req.admin.employeeInfo)} has updated his/her Adhar Information`,
        oldData: oldData,
        newData: newData,
      });

      return res
        .status(OK)
        .json({
          success: true,
          message: "Employee information updated successfully",
          employee: {
            ...oldUser.toObject(),
            panaddhar: {
              ...oldUser.panaddhar,
              aadharCard: filename, // 👈 ensure response mein updated aadhar mile
            },
          },
        });
    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Aadhar of Employee 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  

}


module.exports = new UpdateController();