const UserModel = require('../../../models/userModels/User')
const { USER_BANK_DETAIL_UPDATED, USER_AADHAR_UPDATED, USER_ADDRESS_UPDATED, USER_EMERGENCY_CONTACT_UPDATED, USER_PAN_UPDATED, USER_EXPERIENCE_ADDED, USER_DEGREE_ADDED, USER_INFO_UPDATED } = require("@/config/activity.enums");
const { errorMessage, throwInternalServerError, throwDBResourceNotFoundError, throwMissingFieldsError } = require("@/config/error-handler.config");
const { logWithTime } = require("@/utils/time-stamps");
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { OK } = require('@/config/httpStatus.config');
const { employeeTemplate } = require("@/config/emailTemplates/employeeTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");
const { getFullName } = require("@/utils/commonFunctions");

class UpdateController {

  updateInfo = async (req, res, next) => {
    try {
      const _id = req.params.id;
      const companyId = req.admin.companyId;

      const {
        firstName, middleName, lastName,
        bloodGroup, gender, dob,
        contactNumber, emailPersonal,
        department, dateOfJoining, designation, supervisor
      } = req.body;

      // ⚡ single query: update + return old
      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        {
          $set: {
            "mobile": contactNumber,
            "employeeInfo.firstName": firstName,
            "employeeInfo.middleName": middleName,
            "employeeInfo.lastName": lastName,
            "employeeInfo.bloodGroup": bloodGroup,
            "employeeInfo.gender": gender,
            "employeeInfo.dob": dob,
            "employeeInfo.emailPersonal": emailPersonal,
            "employeeInfo.department": department,
            "employeeInfo.dateOfJoining": dateOfJoining,
            "employeeInfo.designation": designation,
            "employeeInfo.supervisor": supervisor
          }
        },
        { new: false } // return old doc
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      const oldData = {
        userId: _id,
        ...oldUser.employeeInfo.toObject(),
        mobile: oldUser.mobile,
      };

      logWithTime(`✅ 🎯 Employee Information by Admin Updated Successfully 🚀`);

      // Merge old info + incoming update
      const effectiveEmployeeInfo = {
        ...oldUser.employeeInfo.toObject(), // old data
        ...req.body,                        // overwrite with updated fields
      };

      const newData = effectiveEmployeeInfo;
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated information of Employee ID: ${_id})`;
      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.user,
        fileAffected: FILE.file_user_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_INFO_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData, newData
      });

      // Now use this for email
      const empDetails = `Employee Id: ${_id}
Employee Name: ${getFullName(effectiveEmployeeInfo)}`;

      const empLink = `http://localhost:3000/employee/details/${_id}`;

      if (supervisor) {
        const supervisorPerson = await UserModel.findOne({ _id: supervisor, companyId: req.admin.companyId });
        if (supervisorPerson) {
          const emailConfig = {
            ...employeeTemplate.employeeAssigned,
            user_name: getFullName(supervisorPerson.employeeInfo),
            notes: `${empDetails}`,
            actionbutton_text: employeeTemplate.employeeAssigned.actionbutton_text,
            actionlink: empLink,
            fallback_note: employeeTemplate.employeeAssigned.fallback_note,
            action_link: empLink
          };
          const html = generateMasterTemplate(emailConfig);
          sendEmail(supervisorPerson.email, emailConfig.subject, html);
        }
      }

      return res.status(OK).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: { ...oldUser.toObject(), ...{ employeeInfo: newData } }
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Employee Information by Admin 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  updateAddress = async (req, res, next) => {
    try {
      const _id = req.params.id;
      const companyId = req.admin.companyId;
      const { permanentAddress, presentAddress } = req.body;

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        {
          $set: {
            "address.permanentAddress": permanentAddress,
            "address.presentAddress": presentAddress,
          }
        },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated address of Employee ID: ${_id}`;

      const oldData = {
        userId: _id,
        permanentAddress: oldUser.address.permanentAddress,
        presentAddress: oldUser.address.presentAddress,
      };

      const newData = {
        ...oldUser.address, // old data
        ...req.body                     // overwrite updated fields
      };

      logWithTime(`✅ 🎯 Employee Address by Admin Updated Successfully 🚀`);

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.user,
        fileAffected: FILE.file_user_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_ADDRESS_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData, newData
      });

      return res.status(OK).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: { ...oldUser.toObject(), address: newData }
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update address of Employee by Admin 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  updateEmergencyContact = async (req, res, next) => {
    try {
      const _id = req.params.id;
      const companyId = req.admin.companyId;
      const { name, address, number, email } = req.body;

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        {
          $set: {
            "emergencyContact.name": name,
            "emergencyContact.address": address,
            "emergencyContact.number": number,
            "emergencyContact.email": email,
          }
        },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      const oldData = { userId: _id, ...oldUser.emergencyContact.toObject() };
      const newData = {
        ...oldUser.emergencyContact, // old data
        ...req.body                     // overwrite updated fields
      };

      logWithTime(`✅ 🎯 Employee Emergency Contact By Admin Updated Successfully 🚀`);
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated emergency contact of Employee ID: ${_id}`;

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_EMERGENCY_CONTACT_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData, newData
      });

      return res.status(OK).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: { ...oldUser.toObject(), emergencyContact: newData }
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update emergency contact number of Employee by Admin 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  updateBankDetail = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = file && file.filename;

      const _id = req.params.id;
      const companyId = req.admin.companyId;

      const { accountNumber, bankName, ifscCode, accountType, accountHolder } = req.body;

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        {
          $set: {
            "bankDetail.accountNumber": accountNumber,
            "bankDetail.bankName": bankName,
            "bankDetail.ifscCode": ifscCode,
            "bankDetail.accountType": accountType,
            "bankDetail.accountHolder": accountHolder,
            "bankDetail.document": filename
          }
        },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      const oldData = { userId: _id, ...oldUser.bankDetail.toObject?.() || {} };
      const newData = {
        ...oldUser.bankDetail.toObject?.() || {},
        accountNumber,
        bankName,
        ifscCode,
        accountType,
        accountHolder,
        document: filename
      };
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated bank details of Employee ID: ${_id}`;

      logWithTime(`✅ 🎯 Employee Bank Detail by Admin Updated Successfully 🚀`);

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_BANK_DETAIL_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData, newData
      });

      return res.status(OK).json({
        success: true,
        message: 'Employee information updated successfully',
        employee: { ...oldUser.toObject(), bankDetail: newData }
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update bank details of Employee by Admin 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  updateDegreeInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = file && file.filename;

      const _id = req.params.id;
      const companyId = req.admin.companyId;
      const { degree, institute, year, percentage, key } = req.body;

      if (!degree || !institute || !year || !percentage || !file)
        return throwMissingFieldsError(res, "All fields");

      const newDegree = {
        degree,
        institute,
        year,
        percentage,
        key,
        document: filename
      };

      // Single query -> old user returned
      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $push: { degreeInfo: newDegree } },
        { new: false } // returns old doc before update
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "User");

      const oldData = { userId: _id, degreeInfo: oldUser.degreeInfo.slice() };
      const newData = { degreeInfo: [...oldUser.degreeInfo, newDegree] };
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} added degree info of Employee ID: ${_id}`;

      logWithTime(`✅ 🎯 Employee Degree Information by Admin Updated Successfully 🚀`);

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_DEGREE_ADDED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Degree information updated successfully",
        degreeInfo: newData.degreeInfo
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Degree Information 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };


  updateExperienceInfo = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = file && file.filename;

      const _id = req.params.id;
      const companyId = req.admin.companyId;
      const { company, position, dateOfEntry, dateOfExit, key } = req.body;

      if (!company || !position || !dateOfEntry || !dateOfExit || !file)
        return throwMissingFieldsError(res, "All fields");

      const newExperience = {
        company,
        position,
        dateOfEntry,
        dateOfExit,
        key,
        document: filename
      };

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $push: { experience: newExperience } },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "User");

      const oldData = { userId: _id, experience: oldUser.experience.slice() };
      const newData = { experience: [...oldUser.experience, newExperience] };
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} added experience info of Employee ID: ${_id}`;

      logWithTime(`✅ 🎯 Employee Experience Information by Admin Updated Successfully 🚀`);

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_EXPERIENCE_ADDED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData,
        newData
      });

      return res.status(OK).json({
        success: true,
        message: "Experience information updated successfully",
        experienceInfo: newData.experience
      });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Experience Information 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };



  updatePan = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = file && file.filename;

      if (!file) return throwMissingFieldsError(res, "All fields");

      const _id = req.params.id;
      const companyId = req.admin.companyId;

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: { "panaddhar.panCard": filename } },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee PAN Information by Admin Updated Successfully 🚀`);

      const oldData = { userId: _id, panCard: oldUser.panaddhar?.panCard || null };
      const newData = {
        panCard: filename  
      };
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated PAN card of Employee ID: ${_id}`;

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_PAN_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData,
        newData
      });

      return res.status(OK).json({ success: true, message: "Employee information updated successfully", employee: { ...oldUser.toObject(), panaddhar: { ...oldUser.panaddhar, panCard: filename } } });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update PAN 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

  updateAadhar = async (req, res, next) => {
    try {
      const file = req.file;
      const filename = file && file.filename;

      if (!file) return throwMissingFieldsError(res, "All fields");

      const _id = req.params.id;
      const companyId = req.admin.companyId;

      const oldUser = await UserModel.findOneAndUpdate(
        { _id, companyId },
        { $set: { "panaddhar.aadharCard": filename } },
        { new: false }
      );

      if (!oldUser) return throwDBResourceNotFoundError(res, "Employee");

      logWithTime(`✅ 🎯 Employee Aadhar Information by Admin Updated Successfully 🚀`);

      const oldData = { userId: _id, aadharCard: oldUser.panaddhar?.aadharCard || null };
      const newData = {
        aadharCard: filename
      };
      const actionDescription = `Admin ${getFullName(req.admin.employeeInfo)} updated Aadhar card of Employee ID: ${_id}`;

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.core,
        subModuleAffected: SUBMODULE.profile,
        fileAffected: FILE.file_profile_update,
        modelAffected: [MODEL_AFFECTED.model_user],
        eventType: USER_AADHAR_UPDATED,
        actionDone: ACTIONS.update,
        description: actionDescription,
        oldData,
        newData
      });

      return res.status(OK).json({ success: true, message: "Employee information updated successfully", employee: { ...oldUser.toObject(), panaddhar: { ...oldUser.panaddhar, aadharCard: filename } } });

    } catch (error) {
      logWithTime("❌ Internal Error: Failed to update Aadhar 🗑️");
      errorMessage(error);
      return throwInternalServerError(res);
    }
  };

}


module.exports = new UpdateController();