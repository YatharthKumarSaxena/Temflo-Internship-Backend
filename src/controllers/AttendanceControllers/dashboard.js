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
    const notMarked = allEmployees.filter((emp) => !markedUserIds.has(emp._id.toString()));

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
  const plantId = req.headers['plant-id'];

  const searchRegex = new RegExp(searchQuery, 'i');
  const fieldsArray = fields ? fields.split(',') : [];

  const query = { companyId, plantId: req.params.plantId };

  const summaryDate = date ? new Date(date) : new Date();

  // Create start and end of day using new Date objects to avoid mutating the original
  const startOfDay = new Date(summaryDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(summaryDate);
  endOfDay.setHours(23, 59, 59, 999);

  query.date = {
    $gte: startOfDay,
    $lte: endOfDay,
  };

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
    if (searchQuery == 'not marked') {
      const allEmployees = await User.find({ companyId, plantId: req.params.plantId }).select(
        '_id'
      );
      const allEmployeeIds = allEmployees.map((e) => e._id.toString());

      // Get those who marked attendance
      const markedAttendance = await AttendanceRequest.find({
        companyId,
        plantId: req.params.plantId,
        date: { $gte: startOfDay, $lte: endOfDay },
      }).select('userId');

      const markedIds = markedAttendance.map((a) => a.userId.toString());

      // Unmarked employee IDs
      const unmarkedIds = allEmployeeIds.filter((id) => !markedIds.includes(id));

      const total = unmarkedIds.length;
      const pages = Math.ceil(total / limit);

      const paginatedIds = unmarkedIds.slice(skip, skip + limit);

      const data = await User.find({ _id: { $in: paginatedIds } })
        .select('name email employeeCode supervisor')
        .populate('supervisor', 'name email ')
        .populate('plantId', 'name');

      const formattedData = data.map((user) => ({
        userId: user
          ? {
            _id: user._id,
            email: user.email,
            employeeCode: user.employeeCode,
            name: user.name,
          }
          : null,
        companyId: user.companyId,
        status: 'notMarked',
        approver: user.supervisor,
      }));

      return res.status(200).json({
        success: true,
        pagination: {
          page: parseInt(page),
          pages: pages,
          count: total,
        },
        data: formattedData,
        message: 'Unmarked employees fetched successfully',
      });
    } else {
      const totalCount = await AttendanceRequest.countDocuments(query);
      const pages = Math.ceil(totalCount / limit);

      const data = await AttendanceRequest.find(query)
        .sort({ [sortBy]: sortValue })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email employeeCode')
        .populate('approver', 'name email')
        .populate('plantId', 'name');

      return res.status(200).json({
        success: true,
        pagination: {
          page: parseInt(page),
          pages: pages,
          count: totalCount,
        },
        data,
      });
    }
  } catch (error) {
    console.error('Attendance Fetch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
    });
  }
};
