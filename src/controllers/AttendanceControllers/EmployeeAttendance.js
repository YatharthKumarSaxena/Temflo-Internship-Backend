const Attendance = require('../../models/AttendanceModels/Attendance');
const AttendanceRequest = require('../../models/AttendanceModels/AttendanceRequest');
const moment = require('moment');

const EmployeeAttendance = async (req,res) =>{

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
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // Fetch Approved Attendance Requests
    const requests = await AttendanceRequest.find({
      userId:req.admin.id,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // Map attendance records to format
    const records = attendances.map(att => ({
      date: moment(att.date).format('YYYY-MM-DD'),
      empStatus: att.status,
      inTime: att.inTime,
      exitTime: att.outTime,
    }));

    // Add approved requests (only if not already marked in attendance)
    const requestRecords = requests.map(req => ({
      date: moment(req.date).format('YYYY-MM-DD'),
      empStatus: req.status,
      inTime: '--',
      exitTime: '--',
    }));

    const allData = [...records];

    const existingDates = new Set(records.map(r => r.date));

    requestRecords.forEach(req => {
      if (!existingDates.has(req.date)) {
        allData.push(req);
      }
    });

    res.status(200).json({success:true, attendance: allData});
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Server error' });
  }

}

module.exports = EmployeeAttendance