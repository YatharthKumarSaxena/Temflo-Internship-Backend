const LeavePolicy = require('../../models/LeaveModels/leavePolicy');
const LeaveRequest = require('../../models/LeaveModels/LeaveRequest');
const LeaveBalance = require('../../models/LeaveModels/LeaveBalanace');

// 1. View leave balances
exports.getMyLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find({
      userId: req.admin.id,
      companyId: req.admin.companyId
    }).populate('leaveTypeId');

    res.status(200).json({ success: true, balances });

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

    let daysRequested;

    if (durationType === 'first' || durationType === 'second') {
      daysRequested = 0.5;
    } else {
      daysRequested =
        (new Date(toDate) - new Date(fromDate)) / (1000 * 3600 * 24) + 1;
    }

    if (!balance || balance.balance < daysRequested) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient leave balance to apply'
      });
    }

    // Create leave request
    const request = new LeaveRequest({
      userId: req.admin.id,
      companyId: req.admin.companyId,
      leaveTypeId: leaveType,
      fromDate,
      toDate,
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
    const requests = await LeaveRequest.find({ userId: req.admin.id }).sort({ appliedAt: -1 });
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





