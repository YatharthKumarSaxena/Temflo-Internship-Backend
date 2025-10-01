const LeavePolicy = require('../../models/LeaveModels/leavePolicy');
const LeaveRequest = require('../../models/LeaveModels/LeaveRequest');
const LeaveBalance = require('../../models/LeaveModels/LeaveBalanace');
const User = require('../../models/userModels/User');
const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { LEAVE_BALANCE_UPDATED_BY_EMPLOYEE, LEAVE_REQUEST_CREATED_BY_EMPLOYEE, LEAVE_REQUEST_DELETED_BY_EMPLOYEE, LEAVE_REQUEST_STATUS_UPDATED_BY_EMPLOYEE } = require("@/config/activity.enums");
const { leaveTemplate } = require("@/config/emailTemplates/leaveTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

// 1. View leave balances
exports.getMyLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find({
      userId: req.admin._id,
      companyId: req.admin.companyId,
    }).populate({
      path: 'leaveTypeId',
      match: { isActive: true }, // ✅ only active leave types
    });

    const activeBalances = balances.filter((b) => b.leaveTypeId);

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
      companyId: req.admin.companyId,
    }).populate({
      path: 'leaveTypeId',
      match: { isActive: true }, // ✅ only active leave types
    });

    const activeBalances = balances.filter((b) => b.leaveTypeId);

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
      _id: leaveType,
    });
    if (!policy) {
      return res.status(400).json({
        success: false,
        message: 'This Leave Type is not allowed by your company',
      });
    }

    // Fetch leave balance
    const balance = await LeaveBalance.findOne({
      userId: req.admin._id,
      leaveTypeId: leaveType,
      companyId: req.admin.companyId,
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
      daysRequested = (new Date(toDate) - new Date(fromDate)) / (1000 * 3600 * 24) + 1;
    }

    if (balance.balance < daysRequested) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient leave balance to apply',
      });
    }

    const user = await User.findOne({
      _id: req.admin._id,
      companyId: req.admin.companyId,
    });

    // Create leave request
    const request = new LeaveRequest({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      leaveTypeId: leaveType,
      plantId: user.plantId,
      approverId: user.supervisor,
      fromDate,
      toDate: adjustedToDate,
      durationType,
      daysRequested,
      reason,
    });

    await request.save();

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.leave,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_leave,
      modelAffected: [MODEL_AFFECTED.model_leaveRequest],
      eventType: LEAVE_REQUEST_CREATED_BY_EMPLOYEE,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: { _id: request._id, daysRequested: request.daysRequested, leaveTypeId: request.leaveTypeId }
    });

    // Update leave balance
    const oldDataBalance = {};
    if (balance.balance != null) oldDataBalance.balance = balance.balance;
    if (balance.availed != null) oldDataBalance.availed = balance.availed;
    if (!('_id' in oldDataBalance)) oldDataBalance._id = balance._id;

    balance.balance -= daysRequested;
    balance.availed = (balance.availed || 0) + daysRequested;
    await balance.save();

    const newDataBalance = {};
    if (oldDataBalance.balance !== balance.balance) newDataBalance.balance = balance.balance;
    if (oldDataBalance.availed !== balance.availed) newDataBalance.availed = balance.availed;
    if (!('_id' in newDataBalance)) newDataBalance._id = balance._id;

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.leave,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_leave,
      modelAffected: [MODEL_AFFECTED.model_balance],
      eventType: LEAVE_BALANCE_UPDATED_BY_EMPLOYEE,
      actionDone: ACTIONS.update,
      oldData: oldDataBalance,
      newData: newDataBalance
    });

// Find Admin/Supervisor who belongs to same company & plant
const approver = await User.findOne({
  _id: request.approverId,        // kyunki apply ke time approverId save ho gaya tha
  companyId: req.admin.companyId,
  plantId: req.admin.plantId
});

    // ---- EMAIL INTEGRATION ----
    const leaveDetails = `
      Leave Type: ${policy.name}<br/>
      Duration: ${durationType}<br/>
      From: ${fromDate}<br/>
      To: ${adjustedToDate}<br/>
      Days: ${daysRequested}<br/>
      Reason: ${reason}
    `;
    const applyDate = new Date().toLocaleString();

    const emailHtml = generateMasterTemplate({
      company_name: req.admin.companyName,
      user_name: user.name,
      event_name: leaveTemplate.leaveRequestCreatedByEmployee.event_name,
      action: leaveTemplate.leaveRequestCreatedByEmployee.action,
      message_intro: "You have successfully submitted a leave request. Your Request has been sent to Leave Approver",
      notes: `${leaveDetails}<br/>Applied On: ${applyDate}`
    });
    sendEmail(user.email, leaveTemplate.leaveRequestCreatedByEmployee.subject, emailHtml);

// Mail to Approver/Admin
if (approver) {
  const emailHtmlAdmin = generateMasterTemplate({
    company_name: req.admin.companyName,
    user_name: approver.name,
    event_name: leaveTemplate.leaveRequestCreatedByEmployee.event_name,
    action: leaveTemplate.leaveRequestCreatedByEmployee.action,
    message_intro: `Employee whose Id: ${req.admin._id} has applied for leave request.`,
    notes: `${leaveDetails}<br/>Applied On: ${applyDate}`
  });
  sendEmail(approver.email, leaveTemplate.leaveRequestCreatedByEmployee.subject, emailHtmlAdmin);
}
    return res.status(200).json({
      success: true,
      message: 'Leave request submitted and balance updated',
      request,
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// 4. View own leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.admin._id })
      .populate('leaveTypeId', 'name')
      .sort({ appliedAt: -1 });
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
      userId: req.admin._id,
      status: 'Pending',
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Request not found or already processed' });
    }

    // Find and update LeaveBalance
    const balance = await LeaveBalance.findOne({
      userId: req.admin._id,
      leaveTypeId: request.leaveTypeId,
      companyId: req.admin.companyId,
    });

    if (balance) {
      const oldDataBalance = {};
      if (balance.balance != null) oldDataBalance.balance = balance.balance;
      if (balance.availed != null) oldDataBalance.availed = balance.availed;
      if (!('_id' in oldDataBalance)) oldDataBalance._id = balance._id;

      balance.balance += request.daysRequested;
      balance.availed = Math.max(0, (balance.availed || 0) - request.daysRequested);
      await balance.save();

      const newDataBalance = {};
      if (oldDataBalance.balance !== balance.balance) newDataBalance.balance = balance.balance;
      if (oldDataBalance.availed !== balance.availed) newDataBalance.availed = balance.availed;
      if (!('_id' in newDataBalance)) newDataBalance._id = balance._id;

      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.leave,
        subModuleAffected: null,
        fileAffected: FILE.file_employee_leave,
        modelAffected: [MODEL_AFFECTED.model_balance],
        eventType: LEAVE_BALANCE_UPDATED_BY_EMPLOYEE,
        actionDone: ACTIONS.update,
        oldData: oldDataBalance,
        newData: newDataBalance
      });
    }

    const oldRequestData = { _id: request._id }; // Only ID for tracing
    await request.deleteOne();

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.leave,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_leave,
      modelAffected: [MODEL_AFFECTED.model_leaveRequest],
      eventType: LEAVE_REQUEST_DELETED_BY_EMPLOYEE,
      actionDone: ACTIONS.delete,
      oldData: oldRequestData,
      newData: null
    });

// Find Admin/Supervisor who belongs to same company & plant
const approver = await User.findOne({
  _id: request.approverId,        // kyunki apply ke time approverId save ho gaya tha
  companyId: req.admin.companyId,
  plantId: req.admin.plantId
});

    // ---- EMAIL INTEGRATION ----
    const employee = await User.findById(req.admin._id);
    const policy = await LeavePolicy.findById(request.leaveTypeId);

    const leaveDetails = `
      Leave Type: ${policy.name}<br/>
      Duration: ${request.durationType}<br/>
      From: ${request.fromDate}<br/>
      To: ${request.toDate}<br/>
      Days: ${request.daysRequested}<br/>
      Reason: ${request.reason}
    `;
    const cancelDate = new Date().toLocaleString();

    const emailHtml = generateMasterTemplate({
      company_name: req.admin.companyName,
      user_name: employee.name,
      event_name: leaveTemplate.leaveRequestDeletedByEmployee.event_name,
      action: leaveTemplate.leaveRequestDeletedByEmployee.action,
      message_intro: "Your leave request has been deleted.",
      notes: `${leaveDetails}<br/>Cancelled On: ${cancelDate}`
    });
    sendEmail(employee.email, leaveTemplate.leaveRequestDeletedByEmployee.subject, emailHtml);

// Mail to Approver/Admin
if (approver) {
  const emailHtmlAdmin = generateMasterTemplate({
    company_name: req.admin.companyName,
    user_name: approver.name,
    event_name: leaveTemplate.leaveRequestDeletedByEmployee.event_name,
    action: leaveTemplate.leaveRequestDeletedByEmployee.action,
    message_intro: `Employee whose Id: ${req.admin._id} has cancelled his/her leave request.`,
    notes: `${leaveDetails}<br/>Cancelled On: ${cancelDate}`
  });
  sendEmail(approver.email, leaveTemplate.leaveRequestDeletedByEmployee.subject, emailHtmlAdmin);
}

    return res.json({ success: true, message: 'Leave request cancelled and balance restored' });
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
            employeeCode: { $regex: new RegExp(searchQuery, 'i') },
          }).distinct('_id');
          userIds.push(...matched);
        } else if (field === 'userId.email') {
          const matched = await User.find({
            email: { $regex: new RegExp(searchQuery, 'i') },
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
      approverId: req.admin._id,
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
      approverId: mongoose.Types.ObjectId.isValid(req.admin._id)
        ? new mongoose.Types.ObjectId(req.admin._id)
        : req.admin._id,
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
      message: count > 0 ? 'Successfully found leave requests' : 'No matching leave requests found',
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
    const { status } = req.body;

    const request = await LeaveRequest.findById(req.params.id);

if (request.approverId.toString() !== req.admin._id.toString()) {
  return res
    .status(404)
    .json({ success: false, message: `You do not have right to approve leave.` });
}


    if (request.status == status) {
      return res.status(404).json({ success: false, message: `Leave Status is already ${status}` });
    }

    if (request.status == 'Rejected') {
      return res.status(404).json({
        success: false,
        message: 'Leave request already rejected, try to mark new leaves.',
      });
    }

    const oldStatus = request.status;
    request.status = status;
    await request.save();

    // Only keep changed fields for tracing
    const oldDataRequest = { status: oldStatus };
    if (!('_id' in oldDataRequest)) oldDataRequest._id = request._id;

    const newDataRequest = { status: request.status };
    if (!('_id' in newDataRequest)) newDataRequest._id = request._id;

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.leave,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_leave,
      modelAffected: [MODEL_AFFECTED.model_leaveRequest],
      eventType: LEAVE_REQUEST_STATUS_UPDATED_BY_EMPLOYEE,
      actionDone: ACTIONS.update,
      oldData: oldDataRequest,
      newData: newDataRequest
    });

    const balance = await LeaveBalance.findOne({
      userId: request.userId,
      leaveTypeId: request.leaveTypeId,
      companyId: req.admin.companyId,
    });

    const oldDataBalance = {};
    if (balance.balance != null) oldDataBalance.balance = balance.balance;
    if (balance.availed != null) oldDataBalance.availed = balance.availed;
    if (!('_id' in oldDataBalance)) oldDataBalance._id = balance._id;

    balance.balance += request.daysRequested;
    balance.availed = (balance.availed || 0) - request.daysRequested;
    await balance.save();

    const newDataBalance = {};
    if (oldDataBalance.balance !== balance.balance) newDataBalance.balance = balance.balance;
    if (oldDataBalance.availed !== balance.availed) newDataBalance.availed = balance.availed;
    if (!('_id' in newDataBalance)) newDataBalance._id = balance._id;

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.leave,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_leave,
      modelAffected: [MODEL_AFFECTED.model_balance],
      eventType: LEAVE_BALANCE_UPDATED_BY_EMPLOYEE,
      actionDone: ACTIONS.update,
      oldData: oldDataBalance,
      newData: newDataBalance
    });

    // ---- EMAIL INTEGRATION ----
    const employee = await User.findById(request.userId);
    const policy = await LeavePolicy.findById(request.leaveTypeId);
    const adminUser = req.admin;

    const leaveDetails = `
      Leave Type: ${policy.name}<br/>
      Duration: ${request.durationType}<br/>
      From: ${request.fromDate}<br/>
      To: ${request.toDate}<br/>
      Days: ${request.daysRequested}<br/>
      Reason: ${request.reason}
    `;
    const requestDate = new Date().toLocaleString();

    // Email to Employee
    const emailHtmlToEmployee = generateMasterTemplate({
      company_name: adminUser.companyName,
      user_name: employee.name,
      event_name: leaveTemplate.leaveRequestStatusUpdatedByEmployee.event_name,
      action: leaveTemplate.leaveRequestStatusUpdatedByEmployee.action,
      status,
      message_intro: `Your leave request has been ${status.toLowerCase()} by Admin.`,
      notes: `${leaveDetails}<br/>Processed On: ${requestDate}`,
    });
    sendEmail(employee.email, leaveTemplate.leaveRequestStatusUpdatedByEmployee.subject, emailHtmlToEmployee);

    // Email to Admin
    const emailHtmlToAdmin = generateMasterTemplate({
      company_name: adminUser.companyName,
      user_name: adminUser.name,
      event_name: leaveTemplate.leaveRequestStatusUpdatedByEmployee.event_name,
      action: leaveTemplate.leaveRequestStatusUpdatedByEmployee.action,
      status,
      message_intro: `You have ${status.toLowerCase()} the leave request for Employee Id: ${employee._id}.`,
      notes: `${leaveDetails}<br/>Processed On: ${requestDate}`,
    });
    sendEmail(adminUser.email, leaveTemplate.leaveRequestStatusUpdatedByEmployee.subject, emailHtmlToAdmin);

    return res.status(200).json({
      success: true,
      message: status === 'Rejected' ? 'Leave request Rejected Successfully' : 'Leave request Approved Successfully',
      request,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};