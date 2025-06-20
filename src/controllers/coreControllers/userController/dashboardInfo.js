const UserModel = require('../../../models/userModels/User')
const AttendanceSettings = require('../../../models/AttendanceModels/AttendanceSetting');
const Attendance = require('../../../models/AttendanceModels/Attendance')
const LeaveBalance = require('../../../models/LeaveModels/LeaveBalanace');
function matchMonthDay(dateField, targetDate) {
  return {
    $expr: {
      $and: [
        { $eq: [{ $dayOfMonth: `$${dateField}` }, targetDate.getDate()] },
        { $eq: [{ $month: `$${dateField}` }, targetDate.getMonth() + 1] },
      ],
    },
  };
}

class dashboardInfoController{

birthdayInfo = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const birthdayUsers = await UserModel.find({
      companyId: req.admin.companyId,
      ...matchMonthDay('employeeInfo.dob', targetDate),
    }).select('name employeeInfo.dob employeeInfo.firstName employeeInfo.lastName image email');

    return res.status(200).json({
      success: true,
      message: 'Birthday list fetched successfully',
      birthdays: birthdayUsers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching Birthdays',
    });
  }
}

  
    aniiversaryInfo = async (req,res,next) =>{
      try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const AnniversaryUsers = await UserModel.find({
      companyId: req.admin.companyId,
      ...matchMonthDay('employeeInfo.dateOfJoining', targetDate),
    }).select('name employeeInfo.dateOfJoining employeeInfo.firstName employeeInfo.lastName image email');

    return res.status(200).json({
      success: true,
      message: 'Anniversary list fetched successfully',
      anniversaries: AnniversaryUsers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching Anniversaries',
    });
  }

  }

  holidayInfo = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    // Extract only the date part (removing time component)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const holidays = await AttendanceSettings.aggregate([
      {
        $match: {
          companyId: req.admin.companyId,
          plantId: req.admin.plantId // Or get it from query if needed
        }
      },
      { $unwind: '$holidays' },
      {
        $match: {
          'holidays.date': { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$holidays.date',
          occasion: '$holidays.occasion',
          type: '$holidays.type'
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Holiday list fetched successfully',
      result: holidays,
    });
  } catch (err) {
    console.error('Error fetching holiday info:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching holiday info',
    });
  }
};

attendanceToday = async (req,res,next) =>{
  try {

    // Use server's current date
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await Attendance.find({
      userId:req.admin.id,
      companyId:req.admin.companyId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    return res.status(200).json({
      success: true,
      message: 'Today\'s attendance fetched successfully',
      result: attendance.length ? attendance : []
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance'
    });
  }

}

leaveSummary = async (req, res) => {
  try {

    const leaveBalances = await LeaveBalance.find({ userId:req.admin.id, companyId:req.admin.companyId });

    let balance = 0;
    let usedLeaves = 0;

    leaveBalances.forEach((entry) => {
      balance += entry.balance;
      usedLeaves += entry.availed;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalLeaves:balance+usedLeaves,
        usedLeaves
      }
    });
  } catch (error) {
    console.error('Error fetching leave summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leave summary.'
    });
  }
}


getSupervisor = async (req, res) => {
  try {
    const employee = await UserModel.findById(req.admin.id).populate('supervisor', 'name email');

    if (!employee || !employee.supervisor) {
      return res.status(200).json({
        success: true,
        supervisor: {},
      });
    }

    return res.status(200).json({
      success: true,
      supervisor: {
        name: employee.supervisor.name,
        email: employee.supervisor.email,
      },
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching supervisor',
    });
  }
};




}

module.exports = new dashboardInfoController()