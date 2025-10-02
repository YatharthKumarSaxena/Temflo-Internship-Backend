const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting');
const Employee = require('../../models/userModels/User');
const Attendance = require('../../models/AttendanceModels/Attendance');
const EmployeeAttendanceSetting = require('../../models/AttendanceModels/AttendanceEmployeeSetting')
const AttendancePolicy = require('../../models/AttendanceModels/AttendancePolicy')
const User = require('../../models/userModels/User')
const mongoose = require('mongoose')
const moment = require('moment');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");
const { ATTENDANCE_SETTINGS_UPDATED, ATTENDANCE_SETTINGS_CREATED, HOLIDAY_ADDED, HOLIDAY_DELETED, ATTENDANCE_WEEKLY_OFF_UPDATED, ATTENDANCE_MARKED_BY_ADMIN, ATTENDANCE_WORKING_HOURS_UPDATED, ATTENDANCE_POLICY_CREATED, ATTENDANCE_POLICY_UPDATED, ATTENDANCE_POLICY_APPLIED_TO_ALL, ATTENDANCE_POLICY_APPLIED_TO_SELECTED, ATTENDANCE_REQUEST_STATUS_UPDATED } = require('@/config/activity.enums');

// Create or update settings for plant
exports.setSettings = async (req, res) => {
  try {
    const plantId = req.params.plantId;
    const { location, locationBased, approvalRequiredIfLocationDisabled, allowMarking } = req.body;

    if (location && (!location.latitude || !location.longitude || !location.radius)) {
      return res.status(400).json({ success: false, message: 'Invalid location format' });
    }

  

    const updateFields = {
      ...(location && { location }),
      ...(typeof locationBased === 'boolean' && { locationBased }),
      ...(typeof approvalRequiredIfLocationDisabled === 'boolean' && { approvalRequiredIfLocationDisabled }),
      ...(typeof allowMarking === 'boolean' && { allowMarking }),
      plant: plantId,
      companyId: req.admin.compnayId, // add company from plant
    };


    // Get existing settings for proper tracking
    const existingSettings = await AttendanceSettings.findOne({ plantId, companyId: req.admin.companyId });
    const oldData = existingSettings ? existingSettings.toObject() : null;

    const updated = await AttendanceSettings.findOneAndUpdate(
      { plantId,companyId: req.admin.companyId },
      updateFields,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const newData = updated.toObject();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceSetting],
      eventType: oldData ? ATTENDANCE_SETTINGS_UPDATED : ATTENDANCE_SETTINGS_CREATED,
      actionDone: oldData ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: newData,
      description: `Attendance settings ${oldData ? 'updated' : 'created'} for plant ${plantId} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, settings: updated });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to set settings',
      error: err.message,
    });
  }
};

// Get settings for plant
exports.getSettings = async (req, res) => {
  try {
    const plantId = req.params.plantId;
    const settings = await AttendanceSettings.findOne({ plantId });
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get settings', error: err.message });
  }
};

// Add a holiday
exports.addHoliday = async (req, res) => {
  const { date, occasion, type } = req.body;
  const { plantId } = req.params;

  try {
    // Fetch existing settings to get oldData
    const existingSettings = await AttendanceSettings.findOne({ companyId: req.admin.companyId, plantId });
    const oldData = existingSettings ? { holidays: existingSettings.holidays.slice() } : null;

    // Add holiday
    const settings = await AttendanceSettings.findOneAndUpdate(
      { companyId: req.admin.companyId, plantId },
      {
        $setOnInsert: { plantId, companyId: req.admin.companyId },
        $push: { holidays: { date, occasion, type } }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // Prepare newData (only the added holiday)
    const newData = { holidays: [{ date, occasion, type }] };

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceSetting],
      eventType: HOLIDAY_ADDED,
      actionDone: ACTIONS.create,
      oldData: oldData,
      newData: newData,
      description: `Holiday '${occasion}' added for date ${date} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add holiday',
      error: err.message
    });
  }
};

exports.deleteHoliday = async (req, res) => {
  const { plantId, holidayId } = req.params;

  try {
    // Fetch existing settings to get oldData
    const existingSettings = await AttendanceSettings.findOne({ companyId: req.admin.companyId, plantId });
    if (!existingSettings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    // Find the holiday to delete
    const holidayToDelete = existingSettings.holidays.find(h => h._id.toString() === holidayId);
    if (!holidayToDelete) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    // Delete the holiday
    const settings = await AttendanceSettings.findOneAndUpdate(
      { companyId: req.admin.companyId, plantId },
      { $pull: { holidays: { _id: holidayId } } },
      { new: true }
    );

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceSetting],
      eventType: HOLIDAY_DELETED,
      actionDone: ACTIONS.delete,
      oldData: { holidays: [holidayToDelete.toObject()] },
      newData: null,
      description: `Holiday '${holidayToDelete.occasion}' deleted for date ${holidayToDelete.date} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, message: 'Holiday deleted', settings });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete holiday',
      error: err.message
    });
  }
};


// Set weekly off
exports.setWeeklyOff = async (req, res) => {
  const { weeklyOffs } = req.body;
  const { plantId } = req.params;

  try {
    const existingSettings = await AttendanceSettings.findOne({ plantId, companyId: req.admin.companyId });
    const oldData = existingSettings ? { weeklyOffs: existingSettings.weeklyOffs } : null;

    const settings = await AttendanceSettings.findOneAndUpdate(
      { plantId, companyId: req.admin.companyId },
      { weeklyOffs },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceSetting],
      eventType: ATTENDANCE_WEEKLY_OFF_UPDATED,
      actionDone: existingSettings ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: { weeklyOffs },
      description: `Weekly offs ${existingSettings ? 'updated' : 'set'} for plant ${plantId} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set weekly off', error: err.message });
  }
};


// Admin manually marks attendance for user
exports.markAttendance = async (req, res) => {
  const { userId, date, inTime, outTime, status } = req.body;
  const { plantId } = req.params;

  try {
    const employee = await Employee.findById(userId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const existingAttendance = await Attendance.findOne({
      userId,
      plantId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
      }
    });

    const oldData = existingAttendance ? existingAttendance.toObject() : null;

    const attendance = await Attendance.findOneAndUpdate(
      {
        userId,
        plantId,
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      },
      {
        $set: {
          inTime,
          outTime,
          date,
          status,
          companyId: req.admin.companyId,
          approver: employee.supervisor
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const newData = attendance.toObject();

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendance],
      eventType: ATTENDANCE_MARKED_BY_ADMIN,
      actionDone: existingAttendance ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: newData,
      description: `Attendance ${existingAttendance ? 'updated' : 'marked'} by admin ${getFullName(req.admin.employeeInfo)} for employee ${getFullName(employee.employeeInfo)} (${employee.employeeCode}) on ${date}`
    });

    return res.status(200).json({
      success: true,
      attendance,
      message: 'Attendance marked successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: err.message });
  }
};

// Set or update working hours for a plant
exports.setWorkingHours = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { start, end, minHoursRequired } = req.body;

    if (!start || !end || typeof minHoursRequired !== 'number') {
      return res.status(400).json({ success: false, message: 'start, end, and minHoursRequired are required' });
    }

    const existingSettings = await AttendanceSettings.findOne({ plantId, companyId: req.admin.companyId });
    const oldData = existingSettings && existingSettings.workingHours ? { workingHours: existingSettings.workingHours } : null;

    const update = { workingHours: { start, end, minHoursRequired }, plant: plantId };

    const settings = await AttendanceSettings.findOneAndUpdate(
      { plantId, companyId: req.admin.companyId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceSetting],
      eventType: ATTENDANCE_WORKING_HOURS_UPDATED,
      actionDone: existingSettings ? ACTIONS.update : ACTIONS.create,
      oldData: oldData,
      newData: { workingHours: { start, end, minHoursRequired } },
      description: `Working hours ${existingSettings ? 'updated' : 'set'} for plant ${plantId} (${start} - ${end}, ${minHoursRequired}h required) by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, message: 'Working hours updated successfully', settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update working hours', error: err.message });
  }
};

exports.getEmployeeSetting = async (req,res) => {
  try {
    const plantId = req.params.plantId;
    const userId = req.params.userId;
    const settings = await EmployeeAttendanceSetting.findOne({ userId,companyId:req.admin.companyId,plantId });
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get settings', error: err.message });
  }

}


exports.createAttendancePolicy = async (req,res) => {

  try {
          const {
            name,
            plantId,
            isLocationBased,
            isApprovalRequired,
            isMarkingEnabled,
            inTime,
            outTime,
            avgHours,
            location,
            workingHours,
            weeklyOffs,
            remote
          } = req.body;
      
          if (!name || !plantId) {
            return res.status(400).json({ message: "Required fields are missing" });
          }


          const policy = new AttendancePolicy({
            name,
            plantId,
            companyId: req.admin.companyId,
            isLocationBased,
            isApprovalRequired,
            isMarkingEnabled,
            inTime,
            outTime,
            avgHours,
            location,
            workingHours,
            weeklyOffs,
            remote
          })
      
    
      
          await policy.save();

          // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendancePolicy],
      eventType: ATTENDANCE_POLICY_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: policy.toObject(),
      description: `Attendance policy '${name}' created for plant ${plantId} by ${getFullName(req.admin.employeeInfo)}`
    });
          return res.status(200).json({
            success: true,
            message: `Attendance policy created successfully`,
            policy
          });
      
        } catch (error) {
          console.error('Error creating Attendance Policy:', err);
          return res.status(500).json({ success: false, message: err.message });
        }

}

exports.updateAttendancePolicy = async (req,res) => {

  try {
    const {
      name,
      plantId,
      isLocationBased,
      isApprovalRequired,
      isMarkingEnabled,
      inTime,
      outTime,
      avgHours,
      location,
      workingHours,
      weeklyOffs,
      remote
    } = req.body;

    if (!name || !plantId) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Fetch old data for activity tracker
    const existingPolicy = await AttendancePolicy.findOne({
      companyId: req.admin.companyId,
      _id: req.params.id
    });

    if (!existingPolicy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const updatedData = {
      name,
      plantId,
      isLocationBased,
      isApprovalRequired,
      isMarkingEnabled,
      inTime,
      outTime,
      avgHours,
      location,
      workingHours,
      weeklyOffs,
      remote
    }

    const policy = await AttendancePolicy.findOneAndUpdate(
      { companyId: req.admin.companyId, _id: req.params.id },
      updatedData,
      { new: true }
    );

    // Determine changed fields only
    const changedFields = {};
    Object.keys(updatedData).forEach(key => {
      if (JSON.stringify(updatedData[key]) !== JSON.stringify(existingPolicy[key])) {
        changedFields[key] = updatedData[key];
      }
    });

    // Activity Tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendancePolicy],
      eventType: ATTENDANCE_POLICY_UPDATED,
      actionDone: ACTIONS.update,
      oldData: existingPolicy.toObject(),
      newData: policy.toObject(),
      description: `Attendance policy '${name}' updated for plant ${plantId} by ${getFullName(req.admin.employeeInfo)}`
    });

    return res.status(200).json({ success: true, policy });

  } catch (error) {
    console.error('Error creating Attendance Policy:', err);
    return res.status(500).json({ success: false, message: err.message });
  } 


}

exports.getAttendancePolicy = async (req,res) =>{

  try {
      const { plantId } = req.params;
  
      if (!plantId) {
        return res.status(400).json({ success: false, message: "plantId is required in URL params" });
      }
  
      const policies = await AttendancePolicy.find({
        companyId: req.admin.companyId,
        plantId
      });
  
      res.json({ success: true, policies });
    } catch (err) {
      console.error('Error fetching policies:', err);
      res.status(500).json({ success: false, message: "Failed to fetch policies" });
    }

}

// Apply attendance policy to all employees of a plant
exports.applyAttendancePolicy = async (req, res) => {
  try {
    const employees = await User.find({ companyId: req.admin.companyId, plantId: req.params.plantId });
    const policy = await AttendancePolicy.findOne({ _id: req.params.policyId, companyId: req.admin.companyId });

    if (!employees.length || !policy) {
      return res.status(400).json({ success: false, message: 'No employees or policies found.' });
    }

    let createdCount = 0;

    for (const employee of employees) {
      // Fetch old data for activity tracker
      const oldSetting = await EmployeeAttendanceSetting.findOne({
        userId: employee._id,
        companyId: req.admin.companyId,
      });

      const updatedData = {
        plantId: req.params.plantId,
        isLocationBased: policy?.isLocationBased,
        isApprovalRequired: policy?.isApprovalRequired,
        isMarkingEnabled: policy?.isMarkingEnabled,
        location: policy?.location,
        workingHours: policy?.workingHours,
        weeklyOffs: policy?.weeklyOffs,
        remote: policy?.remote,
      };

      await EmployeeAttendanceSetting.updateOne(
        { userId: employee._id, companyId: req.admin.companyId },
        { $set: updatedData },
        { upsert: true }
      );

      // Activity tracker
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.params.plantId,
        module: MODULE.attendance,
        subModuleAffected: null,
        fileAffected: FILE.file_attendance_setting,
        modelAffected: [MODEL_AFFECTED.model_employee_attendance_setting],
        eventType: ATTENDANCE_POLICY_APPLIED_TO_ALL,
        actionDone: ACTIONS.update,
        oldData: oldSetting ? oldSetting.toObject() : null,
        newData: updatedData,
        description: `Attendance policy '${policy.name}' applied to employee ${getFullName(employee.employeeInfo)} (${employee.employeeCode}) by ${getFullName(req.admin.employeeInfo)}`
      });

      createdCount++;
    }

    res.json({ success: true, message: `${createdCount} Attendance Policy Updated/Created.` });
  } catch (err) {
    console.error('Error Updating Policy:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




// Apply attendance policy to selected employees
exports.applyAttendancePolicyToSelectedEmployees = async (req, res) => {
  const { plantId, employeeIds, policyId } = req.body;
  const companyId = req.admin.companyId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const policy = await AttendancePolicy.findOne({ _id: policyId, plantId, companyId }).session(session);
    if (!policy) throw new Error('Attendance policy not found for this company and plant');

    const users = await User.find({ _id: { $in: employeeIds } }).select('_id name employeeCode').lean();

    for (const user of users) {
      const oldSetting = await EmployeeAttendanceSetting.findOne({
        userId: user._id,
        companyId
      }).session(session);

      const updatedData = {
        plantId,
        isLocationBased: policy?.isLocationBased,
        isApprovalRequired: policy?.isApprovalRequired,
        isMarkingEnabled: policy?.isMarkingEnabled,
        location: policy?.location,
        workingHours: policy?.workingHours,
        weeklyOffs: policy?.weeklyOffs,
        remote: policy?.remote,
      };

      await EmployeeAttendanceSetting.updateOne(
        { userId: user._id, companyId },
        { $set: updatedData },
        { upsert: true, session }
      );

      // Activity tracker
      activityTracker({
        userId: req.admin._id,
        companyId: companyId,
        plantId: plantId,
        module: MODULE.attendance,
        subModuleAffected: null,
        fileAffected: FILE.file_attendance_setting,
        modelAffected: [MODEL_AFFECTED.model_employee_attendance_setting],
        eventType: ATTENDANCE_POLICY_APPLIED_TO_SELECTED,
        actionDone: ACTIONS.update,
        oldData: oldSetting ? oldSetting.toObject() : null,
        newData: updatedData,
        description: `Attendance policy '${policy.name}' applied to selected employee ${user.name} (${user.employeeCode}) by ${getFullName(req.admin.employeeInfo)}`
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Attendance policy applied successfully to selected employees.'
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message || 'Failed to apply leave policy.' });
  }
};


exports.EmployeeAttendanceSetting = async (req,res) =>{

  try {
      // Step 1: Find user by _id
      const userId = req.admin.id
      const user = await User.findOne({ _id: userId, companyId:req.admin.companyId });
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const { companyId, plantId } = user;
  
      if (!companyId || !plantId) {
        return res.status(400).json({ success: false, message: 'User does not have company or plant info' });
      }
  
      // Step 2: Find attendance settings using companyId and plantId
      const settings = await EmployeeAttendanceSetting.findOne({ userId,companyId, plantId });
  
      if (!settings) {
        return res.status(404).json({ success: false, message: 'First Set Employee Attendance settings ' });
      }
  
      const holidaySettings = await AttendanceSettings.findOne({ companyId, plantId }, 'holidays'); // Only fetching holidays field
  
      // Attach holidays to the settings response
      const settingsWithHolidays = {
        ...settings.toObject(),
        holidays: holidaySettings?.holidays || [],
      };
      
      res.status(200).json({ success: true, settings:settingsWithHolidays });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

exports.EmployeeAttendance = async (req,res) => {

  const { month, year } = req.query;
     if (!month || !year) {
      return res.status(400).json({ error: 'Month and Year are required' });
    }
  
    const startDate = moment.utc(`${year}-${month}-01`).startOf('month');
    const endDate = moment.utc(startDate).endOf('month');
  
     try {
      // Fetch from Attendance
      const attendances = await Attendance.find({
        userId:req.admin.id,
        companyId:req.admin.companyId,
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });
  
  
      // Map attendance records to format
      const records = attendances.map(att => ({
        date: moment(att.date).format('YYYY-MM-DD'),
        empStatus: att.status,
        inTime: att.inTime,
        exitTime: att.outTime,
      }));
  
      res.status(200).json({success:true, attendance: records});
    } catch (err) {
      console.error('Error fetching attendance:', err);
      res.status(500).json({ error: 'Server error' });
    }
}


exports.getAttendanceRequests = async (req,res) =>{
  try {
      const page = parseInt(req.query.page || 1);
      const limit = parseInt(req.query.items || 10);
      const skip = (page - 1) * limit;
  
      const { sortBy = 'createdAt', sortValue = -1, filter, equal, leaveTypeId } = req.query;
  
      const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
      const searchQuery = req.query.q || '';
  
      let fields = [];
      let userIds = [];
  
      // Search logic
      if (searchQuery && fieldsArray.length > 0) {
        for (const field of fieldsArray) {
          if (field === 'userId.employeeCode') {
            const matched = await User.find({
              employeeCode: { $regex: new RegExp(searchQuery, 'i') }
            }).distinct('_id');
            userIds.push(...matched);
          } else if (field === 'userId.email') {
            const matched = await User.find({
              email: { $regex: new RegExp(searchQuery, 'i') }
            }).distinct('_id');
            userIds.push(...matched);
          } else {
            fields.push({ [field]: { $regex: new RegExp(searchQuery, 'i') } });
          }
        }
      }
  
      // Main filtered query
      const query = {
        companyId: req.admin.companyId,
        approver: req.admin.id,
      };
  
      if (filter && equal) {
        query[filter] = equal;
      }
  
      if (leaveTypeId) {
        query.leaveTypeId = leaveTypeId;
      }
  
      if (fields.length > 0) {
        query.$or = fields;
      }
  
      if (userIds.length > 0) {
        query.$or = [...(query.$or || []), { userId: { $in: userIds } }];
      }
  
      // Date range filter
      if (req.query.startDate && req.query.endDate) {
        query.fromDate = { $gte: new Date(req.query.startDate) };
        query.toDate = { $lte: new Date(req.query.endDate) };
      }
  
      // Paginated + Filtered Results
      const resultsPromise = Attendance.find(query)
        .populate('plantId', 'name')
        .populate('userId', 'employeeCode email')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortValue });
  
      const countPromise = Attendance.countDocuments(query);
  
      // Global Summary (Unfiltered except by company & plant)
      const summaryQuery = {
        companyId: req.admin.companyId,
        approver: mongoose.Types.ObjectId.isValid(req.admin.id)
                ? new mongoose.Types.ObjectId(req.admin.id)
                : req.admin.id,
      };
  
      const totalCountPromise = Attendance.countDocuments(summaryQuery);
  
      const statusCountsPromise = Attendance.aggregate([
        { $match: summaryQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
  
      // Await all promises
      const [result, count, totalCount, statusCounts] = await Promise.all([
        resultsPromise,
        countPromise,
        totalCountPromise,
        statusCountsPromise,
      ]);
  
      // Build Summary
      const statusSummary = {
        present: 0,
        absent: 0,
        pending: 0,
      };
  
     
  
  
      statusCounts.forEach(({ _id, count }) => {
        if (statusSummary.hasOwnProperty(_id)) {
          statusSummary[_id] = count;
        }
      });
  
      const pagination = {
        page,
        pages: Math.ceil(count / limit),
        count,
      };
  
      return res.status(200).json({
        success: true,
        result,
        pagination,
        summary: {
          total: totalCount,
          present: statusSummary['present'],
          absent: statusSummary['absent'],
          pending: statusSummary['pending'],
        },
        message:
          count > 0
            ? 'Successfully found Attendance requests'
            : 'No matching attendance requests found',
      });
    } catch (err) {
      console.error('Leave request error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }


}



exports.updateAttendanceRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.admin._id;

    const request = await Attendance.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Attendance request not found' });
    }

    if (request.approver != userId) {
      return res.status(403).json({ success: false, message: `You do not have right to approve attendance.` });
    }

    if (request.status === status) {
      return res.status(400).json({ success: false, message: `Attendance status is already ${status}` });
    }

    // Save old data for activity tracker
    const oldData = request.toObject();

    // Update status
    request.status = status;
    await request.save();

    // Get employee info for description
    const employee = await User.findById(request.userId).select('employeeCode employeeInfo');

    // Activity tracker
    activityTracker({
      userId: userId,
      companyId: req.admin.companyId,
      plantId: request.plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_attendanceRequest],
      eventType: ATTENDANCE_REQUEST_STATUS_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: request.toObject(),
      description: `Attendance request status updated to '${status}' for employee ${getFullName(employee?.employeeInfo)} (${employee?.employeeCode}) by ${getFullName(req.admin.employeeInfo)}`
    });

    let message = '';
    if (status === 'present') message = 'Attendance approved successfully';
    else if (status === 'pending') message = 'Attendance changed to pending successfully';

    return res.status(200).json({ success: true, message, request });

  } catch (err) {
    console.error('Error updating attendance status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};