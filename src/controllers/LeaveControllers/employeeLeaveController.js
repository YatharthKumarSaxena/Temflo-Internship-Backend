const LeavePolicy = require('../../models/LeaveModels/leavePolicy');
const LeaveRequest = require('../../models/LeaveModels/LeaveRequest');
const LeaveBalance = require('../../models/LeaveModels/LeaveBalanace');
const User = require('../../models/userModels/User')
const mongoose = require('mongoose');

// 1. View leave balances
exports.getMyLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find({
      userId: req.admin.id,
      companyId: req.admin.companyId
    }).populate({
      path: 'leaveTypeId',
      match: { isActive: true }  // ✅ only active leave types
    });

    console.log(req.admin.companyId, req.admin.id )
    const activeBalances = balances.filter(b => b.leaveTypeId);


    res.status(200).json({ success: true, balances: activeBalances });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaveBalancesByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const balances = await LeaveBalance.find({
      userId: employeeId,
      companyId: req.admin.companyId
    }).populate({
      path: 'leaveTypeId',
      match: { isActive: true }  // ✅ only active leave types
    });

    console.log(req.admin.companyId,employeeId)

    const activeBalances = balances.filter(b => b.leaveTypeId);

    res.status(200).json({ success: true, balances: activeBalances });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 3. Apply for leave
exports.applyForLeave = async (req, res) => {
  try {
    const { leaveType, durationType, fromDate, toDate, reason } = req.body;

    // Check if leaveType is valid for the company
    const policy = await LeavePolicy.findOne({
      companyId: req.admin.companyId,
      _id: leaveType
    });
    if (!policy) {
      return res.status(400).json({
        success: false,
        message: 'This Leave Type is not allowed by your company'
      });
    }

    // Fetch leave balance
    const balance = await LeaveBalance.findOne({
      userId: req.admin.id,
      leaveTypeId: leaveType,
      companyId: req.admin.companyId
    });

    if (!balance) {
      return res.status(400).json({
        success: false,
        message: 'Leave balance not found',
      });
    }

    if (!balance.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Policy is not activated',
      });
    }

    let daysRequested;
    let adjustedToDate = toDate;

    if (durationType === 'first' || durationType === 'second') {
      daysRequested = 0.5;
      adjustedToDate = fromDate;
    } else if (durationType === 'full') {
      daysRequested = 1;
      adjustedToDate = fromDate;
    } else {
      daysRequested =
        (new Date(toDate) - new Date(fromDate)) / (1000 * 3600 * 24) + 1;
    }

    if (balance.balance < daysRequested) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient leave balance to apply',
      });
    }

    const user = await User.findOne({
      _id: req.admin.id,
      companyId: req.admin.companyId
    });

    // Create leave request
    const request = new LeaveRequest({
      userId: req.admin.id,
      companyId: req.admin.companyId,
      leaveTypeId: leaveType,
      plantId:user.plantId,
      approverId:user.supervisor,
      fromDate,
      toDate: adjustedToDate,
      durationType,
      daysRequested,
      reason
    });

    await request.save();

    // Update leave balance
    balance.balance -= daysRequested;
    balance.availed = (balance.availed || 0) + daysRequested;
    await balance.save();

    res.status(200).json({
      success: true,
      message: 'Leave request submitted and balance updated',
      request
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};


// 4. View own leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.admin.id }).populate('leaveTypeId', 'name').sort({ appliedAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Cancel a pending leave request
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const request = await LeaveRequest.findOne({
      _id: req.params.requestId,
      userId: req.admin.id,
      status: 'Pending'
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found or already processed' });
    }

    

    // Find and update LeaveBalance
    const balance = await LeaveBalance.findOne({
      userId: req.admin.id,
      leaveTypeId: request.leaveTypeId,
      companyId: req.admin.companyId
    });

    if (balance) {
      balance.balance += request.daysRequested;
      balance.availed = Math.max(0, balance.availed - request.daysRequested); // Prevent negative
      await balance.save();
    }

    await request.deleteOne();

    res.json({ success: true, message: 'Leave request cancelled and balance restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getLeaveRequests = async (req, res) => {
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
      approverId: req.admin.id,
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
    const resultsPromise = LeaveRequest.find(query)
      .populate('plantId', 'name')
      .populate('userId', 'employeeCode email')
      .populate('leaveTypeId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue });

    const countPromise = LeaveRequest.countDocuments(query);

    // Global Summary (Unfiltered except by company & plant)
    const summaryQuery = {
      companyId: req.admin.companyId,
      approverId: mongoose.Types.ObjectId.isValid(req.admin.id)
              ? new mongoose.Types.ObjectId(req.admin.id)
              : req.admin.id,
    };

    const totalCountPromise = LeaveRequest.countDocuments(summaryQuery);

    const statusCountsPromise = LeaveRequest.aggregate([
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
      Approved: 0,
      Pending: 0,
      Rejected: 0,
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
        approved: statusSummary['Approved'],
        pending: statusSummary['Pending'],
        rejected: statusSummary['Rejected'],
      },
      message:
        count > 0
          ? 'Successfully found leave requests'
          : 'No matching leave requests found',
    });
  } catch (err) {
    console.error('Leave request error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { status} = req.body;

    const request = await LeaveRequest.findById(req.params.id);

    if(request.approverId != req.admin.id){
      return res.status(404).json({ success: false, message: `You do not have right to approve leave.` })
 
    }

    if(request.status == status){
        return res.status(404).json({ success: false, message: `Leave Status is already ${status}` })

    }

    if(request.status == "Rejected"){
      return res.status(404).json({ success: false, message: 'Leave request already rejected, try to mark new leaves.' })
    }

    if(request.status == "Pending" && status == "Approved"){
      request.status = status;
      await request.save();

      return res.status(200).json({ success: true,message:"Leave Aprroved Sucessfully",request });
    }

    if(request.status == "Approved" && status == "Pending"){
      request.status = status;
      await request.save();

      return res.status(200).json({ success: true,message:"Leave Changed To Pending Sucessfully",request });
    }

    request.status = status;
    await request.save();

    const balance = await LeaveBalance.findOne({
        userId: request.userId,
        leaveTypeId: request.leaveTypeId,
        companyId: req.admin.companyId
      });

      balance.balance += request.daysRequested;
      balance.availed = balance.availed - request.daysRequested;
      await balance.save();

      res.status(200).json({
        success: true,
        message: 'Leave request Rejected Sucessfully',
        request
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


