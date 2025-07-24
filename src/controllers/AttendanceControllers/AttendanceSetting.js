const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting');
const Employee = require('../../models/userModels/User');
const Attendance = require('../../models/AttendanceModels/Attendance');
const EmployeeAttendanceSetting = require('../../models/AttendanceModels/AttendanceEmployeeSetting')
const AttendancePolicy = require('../../models/AttendanceModels/AttendancePolicy')
const User = require('../../models/userModels/User')
const mongoose = require('mongoose')

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


    const updated = await AttendanceSettings.findOneAndUpdate(
      { plantId,companyId: req.admin.companyId },
      updateFields,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
  const { plantId } = req.params; // Assuming companyId is in the route

  try {
    const settings = await AttendanceSettings.findOneAndUpdate(
      { companyId: req.admin.companyId, plantId },
      {
        $setOnInsert: { plantId, companyId: req.admin.companyId }, // Only set when inserting new doc
        $push: { holidays: { date, occasion, type } }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add holiday', error: err.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  const { plantId, holidayId } = req.params;

  try {
    const settings = await AttendanceSettings.findOneAndUpdate(
      { companyId: req.admin.companyId, plantId },
      {
        $pull: { holidays: { _id: holidayId } }
      },
      { new: true }
    );

    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    res.status(200).json({ success: true, message: 'Holiday deleted', settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete holiday', error: err.message });
  }
};



// Set weekly off
exports.setWeeklyOff = async (req, res) => {
  const { weeklyOffs } = req.body;
  const { plantId } = req.params;

  try {
    const settings = await AttendanceSettings.findOneAndUpdate(
      { plantId,companyId: req.admin.companyId },
      { weeklyOffs },
      { new: true,upsert: true }
    );

    res.status(200).json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set weekly off', error: err.message });
  }
};

// Admin manually marks attendance for user
exports.markAttendance = async (req, res) => {
  const { userId,date,inTime,outTime,status } = req.body;
  const { plantId } = req.params;

  try {
    const employee = await Employee.findById(userId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const attendance = await Attendance.create({
      userId,
      plantId,
      date,
      inTime,
      outTime,
      status,
      companyId:req.admin.companyId
    });

    res.status(200).json({ success: true, attendance, message:"Attendance Marked Sucessfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: err.message });
  }
};


// Set or update working hours for a plant
exports.setWorkingHours = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { start, end, minHoursRequired } = req.body;

    // Basic validation
    if (!start || !end || typeof minHoursRequired !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'start, end, and minHoursRequired are required',
      });
    }

    const update = {
      workingHours: { start, end, minHoursRequired },
      plant: plantId
    };

    const settings = await AttendanceSettings.findOneAndUpdate(
      { plantId },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Working hours updated successfully',
      settings
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update working hours',
      error: err.message
    });
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

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

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

exports.applyAttendancePolicy = async (req,res) => {
  try {
    const employees = await User.find({companyId:req.admin.companyId,plantId:req.params.plantId});
    
    const policy = await AttendancePolicy.findOne({ _id:req.params.policyId,companyId:req.admin.companyId});

    if (employees.length === 0 || policy.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees or policies found.' });
    }

    let createdCount = 0;

    for (const employee of employees) {
      
      await EmployeeAttendanceSetting.updateOne(
        {
          userId: employee._id,
          companyId: req.admin.companyId,
        },
        {
          $set: {
            plantId: req.params.plantId,
            isLocationBased: policy?.isLocationBased,
            isApprovalRequired: policy?.isApprovalRequired,
            isMarkingEnabled: policy?.isMarkingEnabled,
            location: policy?.location,
            workingHours: policy?.workingHours,
            weeklyOffs: policy?.weeklyOffs,
            remote: policy?.remote,
          },
        },
        { upsert: true }
      );

        createdCount++;
      
    }

    res.json({ success: true, message: `${createdCount} Attendance Policy Updated/Created.` });

  } catch (err) {
    console.error('Error Updating Policy:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}



exports.applyAttendancePolicyToSelectedEmployees = async (req, res) => {
  const { plantId, employeeIds, policyId } = req.body;
  const companyId = req.admin.companyId;

  const session = await mongoose.startSession();
  session.startTransaction();

  const alreadyApplied = [];
  const now = new Date();

  try {
    const policy = await AttendancePolicy.findOne({
      _id: policyId,
      plantId,
      companyId
    }).session(session);

    if (!policy) {
      throw new Error('Attendance policy not found for this company and plant');
    }



    const users = await User.find({
      _id: { $in: employeeIds }
    }).select('_id name employeeCode').lean();

    for (const user of users) {
    
      await EmployeeAttendanceSetting.updateOne(
        {
          userId: user._id,
          companyId: req.admin.companyId,
        },
        {
          $set: {
            plantId: plantId,
            isLocationBased: policy?.isLocationBased,
            isApprovalRequired: policy?.isApprovalRequired,
            isMarkingEnabled: policy?.isMarkingEnabled,
            location: policy?.location,
            workingHours: policy?.workingHours,
            weeklyOffs: policy?.weeklyOffs,
            remote: policy?.remote,
          },
        },
        { upsert: true, session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Attendance policy applied successfully to selected employees.',
      alreadyApplied // List of users who already had leave applied
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to apply leave policy.'
    });
  }
};

