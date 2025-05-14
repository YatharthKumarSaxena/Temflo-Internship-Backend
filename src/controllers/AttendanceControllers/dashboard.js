const AttendanceRequest = require('../../models/AttendanceModels/AttendanceRequest')

const dashboard = async (req, res) => {

  const { plantId } = req.params;
  const{ date} = req.query
  const summaryDate = date ? new Date(date) : new Date();

  try {
const requests = await AttendanceRequest.find({
      companyId:req.admin.companyId,
      plantId,
      date: {
        $gte: new Date(summaryDate.setHours(0, 0, 0, 0)),
        $lte: new Date(summaryDate.setHours(23, 59, 59, 999))
      }
    }).populate('userId', 'name email employeeId') // populate basic user details
    .populate('approver', 'name email');      
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const rejected = requests.filter(r => r.status === 'rejected');

    const summary = {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      allRequests: requests,
    };

    return res.status(200).json({ success: true, summary });  
} catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch Attendance report.' });
  }

  

};

module.exports = dashboard;
