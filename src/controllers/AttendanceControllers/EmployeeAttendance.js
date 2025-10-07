const Attendance = require('../../models/AttendanceModels/Attendance');
const moment = require('moment');

const EmployeeAttendance = async (req,res) =>{

   const { month, year, employeeId } = req.query;
   if (!month || !year) {
    return res.status(400).json({ error: 'Month and Year are required' });
  }

  const startDate = moment.utc(`${year}-${month}-01`).startOf('month');
  const endDate = moment.utc(startDate).endOf('month');

   try {
    // Fetch from Attendance
    const attendances = await Attendance.find({
      userId:employeeId,
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

module.exports = EmployeeAttendance