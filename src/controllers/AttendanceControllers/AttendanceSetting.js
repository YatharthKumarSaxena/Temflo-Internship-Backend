const AttendanceSettings = require('../../models/AttendanceModels/AttendanceSetting');
const Employee = require('../../models/userModels/User');
const Attendance = require('../../models/AttendanceModels/Attendance');

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

