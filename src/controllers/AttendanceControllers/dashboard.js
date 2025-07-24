const AttendanceRequest = require('../../models/AttendanceModels/Attendance');
const User = require('../../models/userModels/User');

exports.Attendancesummary = async (req, res) => {
  const { plantId } = req.params;
  const { date } = req.query;
  const summaryDate = date ? new Date(date) : new Date();

  const startOfDay = new Date(summaryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(summaryDate.setHours(23, 59, 59, 999));

  try {
    // Fetch all employees in the plant
    const allEmployees = await User.find({
      companyId: req.admin.companyId,
      plantId,
    }).select('_id name email employeeCode');

    // Attendance records on that date
    const attendanceRequests = await AttendanceRequest.find({
      companyId: req.admin.companyId,
      plantId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('userId', 'name email employeeCode')
      .populate('approver', 'name email')
      .populate('plantId', 'name');

    // Create a map of users who marked attendance
    const markedUserIds = new Set(attendanceRequests.map((req) => req.userId?._id?.toString()));

    const pending = [];
    const present = [];
    const absent = [];

    attendanceRequests.forEach((request) => {
      const status = request.status;
      if (status === 'present') present.push(request);
      else if (status === 'absent') absent.push(request);
      else if (status === 'pending') pending.push(request);
    });

    // Users with no attendance request at all (Not Marked)
    const notMarked = allEmployees.filter(emp => !markedUserIds.has(emp._id.toString()));

    const summary = {
      presentCount: present.length,
      absentCount: absent.length,
      pendingCount: pending.length,
      notMarkedCount: notMarked.length,
    };

    return res.status(200).json({
      success: true,
      summary,
      message: 'Attendance dashboard data fetched successfully',
    });

  } catch (err) {
    console.error('Dashboard Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Attendance report.',
    });
  }
};


exports.getAttendanceRequests = async (req, res) => {
  const {
    page = 1,
    items = 10,
    sortBy = 'createdAt',
    sortValue = -1,
    filter,
    equal,
    q: searchQuery = '',
    fields,
    date,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(items);
  const limit = parseInt(items);

  const companyId = req.admin.companyId;
  const searchRegex = new RegExp(searchQuery, 'i');
  const fieldsArray = fields ? fields.split(',') : [];

  const query = { companyId, plantId: req.params.plantId, };

  // Filter by specific date
  if (date) {
    const dateObj = new Date(date);
    query.date = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lte: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  // Filtering by status/plantId/userId, etc.
  if (filter && equal) {
    query[filter] = equal;
  }

  // Search logic
  if (searchQuery && fieldsArray.length > 0) {
    query.$or = fieldsArray.map((field) => ({
      [field]: { $regex: searchRegex },
    }));
  }

  try {
    const totalCount = await AttendanceRequest.countDocuments(query);

    const data = await AttendanceRequest.find(query)
      .sort({ [sortBy]: sortValue })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email employeeCode')
      .populate('approver', 'name email')
      .populate('plantId', 'name');



    return res.status(200).json({
      success: true,
      total: totalCount,
      page: parseInt(page),
      items: parseInt(items),
      data,
    });

  } catch (error) {
    console.error('Attendance Fetch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
    });
  }
};

