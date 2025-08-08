const LeavePolicy = require('../../models/LeaveModels/leavePolicy');
const LeaveBalance = require('../../models/LeaveModels/LeaveBalanace');
const LeaveRequest = require('../../models/LeaveModels/LeaveRequest');
const Permission = require('../../models/userModels/Permission');
const User = require('../../models/userModels/User');
const mongoose = require('mongoose');

const getPeriodString = (policy, date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (policy.credit.frequency) {
    case 'monthly':
      return `${year}-${month.toString().padStart(2, '0')}`;
    case 'quarterly':
      return `${year}-Q${Math.ceil(month / 3)}`;
    case 'yearly':
      return `${year}`;
    default:
      return `${year}-${month.toString().padStart(2, '0')}`; // fallback
  }
};

exports.createLeavePolicy = async (req, res) => {
  try {
    const {
      name,
      count,
      credit,
      expiry,
      creditOnCreation,
      isAdvanceAllowed,
      applyToAll,
      plantId,
      type = 'leave', // Default to 'leave' (lowercase for consistency)
    } = req.body;

    // Basic required field check
    if (!name || !plantId) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    // Validate type
    const normalizedType = type.toLowerCase();
    if (!['leave', 'wfh'].includes(normalizedType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid policy type. Must be 'leave' or 'wfh'" });
    }

    // For regular leave or WFH with policy, do validations
    const isWFH = normalizedType === 'wfh';
    const isWFHWithoutPolicy = isWFH && (count == null || credit == null || expiry == null);

    if (!isWFHWithoutPolicy) {
      if (count == null || !credit?.frequency || !expiry?.frequency) {
        return res.status(400).json({ success: false, message: 'Required fields are missing' });
      }

      if (
        credit.frequency !== 'custom' &&
        (typeof credit.dayOfMonth !== 'number' || credit.dayOfMonth < 1 || credit.dayOfMonth > 31)
      ) {
        return res.status(400).json({ success: false, message: 'Invalid credit day' });
      }

      if (
        expiry.frequency !== 'custom' &&
        expiry.frequency !== 'never' &&
        (typeof expiry.dayOfMonth !== 'number' || expiry.dayOfMonth < 1 || expiry.dayOfMonth > 31)
      ) {
        return res.status(400).json({ success: false, message: 'Invalid expiry day' });
      }
    }

    // Check if WFH policy already exists (one per plant)
    if (isWFH) {
      const existingWFH = await LeavePolicy.findOne({
        companyId: req.admin.companyId,
        plantId,
        type: 'wfh',
      });
      if (existingWFH) {
        return res
          .status(400)
          .json({ success: false, message: 'WFH policy already exists for this plant' });
      }
    }

    const policy = new LeavePolicy({
      companyId: req.admin.companyId,
      plantId,
      name,
      type: normalizedType,
      count: isWFHWithoutPolicy ? null : count,
      credit: isWFHWithoutPolicy ? null : credit,
      expiry: isWFHWithoutPolicy ? null : expiry,
      creditOnCreation: isWFHWithoutPolicy ? false : creditOnCreation ?? false,
      isAdvanceAllowed: isWFHWithoutPolicy ? false : isAdvanceAllowed ?? false,
      applyToAll: isWFHWithoutPolicy ? false : applyToAll ?? true,
    });

    await policy.save();

    return res.status(200).json({
      success: true,
      message: `${normalizedType === 'wfh' ? 'WFH' : 'Leave'} policy created successfully`,
      policy,
    });
  } catch (err) {
    console.error('Error creating Leave Policy:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLeavePolicy = async (req, res) => {
  try {
    const {
      name,
      count,
      credit,
      expiry,
      creditOnCreation,
      isAdvanceAllowed,
      applyToAll,
      plantId,
      type = 'leave', // default to leave if not provided
    } = req.body;

    if (!name || !plantId) {
      return res.status(400).json({ success: false, message: 'Name and plantId are required' });
    }

    const normalizedType = type.toLowerCase();
    const isWFH = normalizedType === 'wfh';
    const isWFHWithoutPolicy = isWFH && (count == null || credit == null || expiry == null);

    if (!isWFHWithoutPolicy) {
      // Validate fields only if policy is required
      if (
        count == null ||
        !credit?.frequency ||
        (credit.frequency !== 'custom' &&
          (typeof credit.dayOfMonth !== 'number' ||
            credit.dayOfMonth < 1 ||
            credit.dayOfMonth > 31)) ||
        (credit.frequency === 'custom' &&
          (!Array.isArray(credit.customDates) || credit.customDates.length === 0)) ||
        !expiry?.frequency ||
        (expiry.frequency !== 'never' &&
          expiry.frequency !== 'custom' &&
          (typeof expiry.dayOfMonth !== 'number' ||
            expiry.dayOfMonth < 1 ||
            expiry.dayOfMonth > 31)) ||
        (expiry.frequency === 'custom' && !expiry.customDate)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'All required fields must be filled correctly' });
      }
    }

    const updatedData = {
      name,
      type: normalizedType,
      plantId,
      count: isWFHWithoutPolicy ? null : count,
      credit: isWFHWithoutPolicy ? null : credit,
      expiry: isWFHWithoutPolicy ? null : expiry,
      creditOnCreation: isWFHWithoutPolicy ? false : creditOnCreation || false,
      isAdvanceAllowed: isWFHWithoutPolicy ? false : isAdvanceAllowed || false,
      applyToAll: isWFHWithoutPolicy ? false : applyToAll ?? true,
    };

    const policy = await LeavePolicy.findOneAndUpdate(
      { companyId: req.admin.companyId, _id: req.params.id },
      updatedData,
      { new: true }
    );

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    return res.status(200).json({ success: true, policy });
  } catch (err) {
    console.error('Error updating policy:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Delete Leave Policy
exports.deleteLeavePolicy = async (req, res) => {
  try {
    // First, find the policy by companyId and _id
    const policy = await LeavePolicy.findOne({
      companyId: req.admin.companyId,
      _id: req.params.id,
    });

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    // Toggle isActive status
    const updated = await LeavePolicy.findByIdAndUpdate(
      policy._id,
      { isActive: !policy.isActive },
      { new: true }
    );

    res.json({
      success: true,
      message: `Policy marked as ${updated.isActive ? 'active' : 'inactive'}`,
      policy: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get leave policies by company and plantId
exports.getCompanyLeavePolicies = async (req, res) => {
  try {
    const { plantId } = req.params;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'plantId is required in URL params' });
    }

    const policies = await LeavePolicy.find({
      companyId: req.admin.companyId,
      plantId,
    });

    res.json({ success: true, policies });
  } catch (err) {
    console.error('Error fetching policies:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
};

exports.applyLeavePolicyToSelectedEmployees = async (req, res) => {
  const { plantId, employeeIds, policyId } = req.body;
  const companyId = req.admin.companyId;

  const session = await mongoose.startSession();
  session.startTransaction();

  const alreadyApplied = [];
  const now = new Date();

  try {
    const policy = await LeavePolicy.findOne({
      _id: policyId,
      plantId,
      companyId,
    }).session(session);

    if (!policy) {
      throw new Error('Leave policy not found for this company and plant');
    }

    if (!policy.isActive) {
      return res.status(200).json({
        success: false,
        message: 'Please Active Leave Policy To Apply',
      });
    }

    const period = getPeriodString(policy, now);

    const users = await User.find({
      _id: { $in: employeeIds },
    })
      .select('_id name employeeCode')
      .lean();

    for (const user of users) {
      const existingBalance = await LeaveBalance.findOne({
        userId: user._id,
        leaveTypeId: policy._id,
      }).session(session);

      if (existingBalance && existingBalance.lastCreditedPeriod === period) {
        alreadyApplied.push({
          name: user.name,
          employeeCode: user.employeeCode,
        });
        continue;
      }

      if (existingBalance) {
        existingBalance.balance += policy.count;
        existingBalance.lastCredited = now;
        existingBalance.lastCreditedPeriod = period;
        await existingBalance.save({ session });
      } else {
        await LeaveBalance.create(
          [
            {
              userId: user._id,
              companyId,
              leaveTypeId: policy._id,
              leaveTypeName: policy.name,
              balance: policy.count,
              lastCredited: now,
              lastCreditedPeriod: period,
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Leave policy applied successfully to selected employees.',
      alreadyApplied, // List of users who already had leave applied
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to apply leave policy.',
    });
  }
};

exports.getPolicyEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;
    const { policyId } = req.params;

    const { sortBy = 'enabled', sortValue = -1, filter, equal, q: searchQuery = '' } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    // Init search arrays
    const searchFields = [];
    let plantIds = [];

    if (searchQuery && fieldsArray.length > 0) {
      for (const field of fieldsArray) {
        if (field === 'plantId.name') {
          const matchedPlants = await Plant.find({
            name: { $regex: new RegExp(searchQuery, 'i') },
            companyId: req.admin.companyId,
          }).select('_id');

          plantIds = matchedPlants.map((p) => p._id);
        } else {
          searchFields.push({ [field]: { $regex: new RegExp(searchQuery, 'i') } });
        }
      }
    }

    // Base query
    const baseQuery = {
      removed: false,
      companyId: req.admin.companyId,
      role: { $in: ['admin', 'employee'] },
      ...(filter && equal ? { [filter]: equal } : {}),
    };

    // Plant permissions for employee
    if (req.admin.role === 'employee') {
      const permissions = await Permission.find({ employeeId: req.admin._id });
      const allowedPlantIds = permissions.map((p) => p.plantId);
      if (!allowedPlantIds.length) {
        return res.status(403).json({ message: 'No plant permissions found' });
      }
      baseQuery.plantId = { $in: allowedPlantIds };
    }

    // If plant search is applied
    if (plantIds.length > 0) {
      baseQuery.$or = [
        ...(searchFields.length > 0 ? searchFields : []),
        { plantId: { $in: plantIds } },
      ];
    } else if (searchFields.length > 0) {
      baseQuery.$or = searchFields;
    }

    const users = await User.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue, _id: 1 })
      .select('name email employeeCode')
      .lean()
      .exec();

    // Fetch all employeeIds with active policies
    const employeeIds = users.map((u) => u._id);

    const activePolicyMap = await LeaveBalance.find({
      userId: { $in: employeeIds },
      leaveTypeId: policyId,
    })
      .select('userId')
      .lean();

    const activeEmployeeSet = new Set(activePolicyMap.map((p) => String(p.userId)));

    // Append isPolicyApplied to each user
    const result = users.map((user) => ({
      ...user,
      isPolicyApplied: activeEmployeeSet.has(String(user._id)),
    }));

    const count = await User.countDocuments(baseQuery);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    return res.status(count ? 200 : 203).json({
      success: true,
      result,
      pagination,
      message: count ? 'Successfully found all documents' : 'Collection is Empty',
    });
  } catch (err) {
    console.error('Error in paginatedList:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message,
    });
  }
};

exports.activatePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { isActive } = req.body;

    const updatedPolicy = await LeaveBalance.findOneAndUpdate(
      { _id: policyId, companyId: req.admin.companyId },
      { isActive },
      { new: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({ message: 'Policy not found or access denied' });
    }

    return res.status(200).json({
      message: `Policy successfully ${isActive ? 'activated' : 'deactivated'}`,
      data: updatedPolicy,
    });
  } catch (error) {
    console.error('Toggle policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 5. View all leave balances
exports.getCompanyLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find({ companyId: req.params.companyId }).populate(
      'employeeId'
    );
    res.json({ success: true, balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markLeave = async (req, res) => {
  try {
    const { userId, plantId, leaveType, durationType, fromDate, toDate, reason } = req.body;

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
      userId,
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

    // Determine leave days
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

    // Create leave request
    const request = new LeaveRequest({
      userId,
      companyId: req.admin.companyId,
      plantId,
      leaveTypeId: leaveType,
      fromDate,
      toDate: adjustedToDate,
      durationType,
      daysRequested,
      reason,
      approverId: req.admin.companyId,
      status: 'Approved',
    });

    await request.save();

    // Update leave balance
    balance.balance -= daysRequested;
    balance.availed = (balance.availed || 0) + daysRequested;
    await balance.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request submitted and balance updated',
      request,
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// 6. View all leave requests

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
      plantId: req.params.plantId,
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
      plantId: mongoose.Types.ObjectId.isValid(req.params.plantId)
        ? new mongoose.Types.ObjectId(req.params.plantId)
        : req.params.plantId,
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

// 7. Approve/Reject a leave request
exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const request = await LeaveRequest.findById(req.params.id);

    if (request.status == status) {
      return res.status(404).json({ success: false, message: `Leave Status is already ${status}` });
    }

    if (request.status == 'Rejected') {
      return res
        .status(404)
        .json({
          success: false,
          message: 'Leave request already rejected, try to mark new leaves.',
        });
    }

    if (request.status == 'Pending' && status == 'Approved') {
      request.status = status;
      await request.save();

      return res
        .status(200)
        .json({ success: true, message: 'Leave Aprroved Sucessfully', request });
    }

    if (request.status == 'Approved' && status == 'Pending') {
      request.status = status;
      await request.save();

      return res
        .status(200)
        .json({ success: true, message: 'Leave Changed To Pending Sucessfully', request });
    }

    request.status = status;
    await request.save();

    const balance = await LeaveBalance.findOne({
      userId: request.userId,
      leaveTypeId: request.leaveTypeId,
      companyId: req.admin.companyId,
    });

    balance.balance += request.daysRequested;
    balance.availed = balance.availed - request.daysRequested;
    await balance.save();

    res.status(200).json({
      success: true,
      message: 'Leave request Rejected Sucessfully',
      request,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLeaveBalance = async (req, res) => {
  try {
    const employees = await User.find({
      companyId: req.admin.companyId,
      plantId: req.params.plantId,
    });
    const policy = await LeavePolicy.findOne({
      _id: req.params.policyId,
      companyId: req.admin.companyId,
    });

    if (employees.length === 0 || policy.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees or policies found.' });
    }

    let createdCount = 0;
    for (const employee of employees) {
      const existing = await LeaveBalance.findOne({
        userId: employee._id,
        leaveTypeId: policy._id,
      });

      if (!existing) {
        await LeaveBalance.create({
          userId: employee._id,
          leaveTypeId: policy._id,
          companyId: req.admin.companyId,
          leaveTypeName: policy.name,
          balance: policy.count,
          lastCredited: new Date(),
        });
        createdCount++;
      }
    }

    res.json({ success: true, message: `${createdCount} leave balances created.` });
  } catch (err) {
    console.error('Error creating balances:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetLeaveBalance = async (req, res) => {
  try {
    const employees = await User.find({
      companyId: req.admin.companyId,
      plantId: req.params.plantId,
    });

    const policy = await LeavePolicy.findOne({
      _id: req.params.policyId,
      companyId: req.admin.companyId,
    });

    if (employees.length === 0 || !policy) {
      return res.status(400).json({ success: false, message: 'No employees or policy found.' });
    }

    let updatedCount = 0;

    for (const employee of employees) {
      const leaveBalance = await LeaveBalance.findOne({
        userId: employee._id,
        leaveTypeId: policy._id,
      });

      if (leaveBalance) {
        leaveBalance.balance = 0;
        leaveBalance.lastCredited = new Date();
        await leaveBalance.save();
        updatedCount++;
      }
    }

    res.json({ success: true, message: `${updatedCount} leave balances reset to 0.` });
  } catch (err) {
    console.error('Error resetting leave balances:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getEmployeeOnLeave = async (req, res) => {
  try {
    const queryDate = req.query.date ? new Date(req.query.date) : new Date();

    const approvedLeaves = await LeaveRequest.find({
      companyId: req.admin.companyId,
      status: 'Approved',
      fromDate: { $lte: queryDate },
      toDate: { $gte: queryDate },
    })
      .populate('userId', 'name email image') // adjust fields as needed
      .populate('leaveTypeId', 'name') // if you want leave type info
      .sort({ fromDate: 1 });

    return res.status(200).json({
      success: true,
      message: 'Approved leaves fetched successfully',
      data: approvedLeaves,
    });
  } catch (error) {
    console.error('Error fetching approved leaves:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching approved leaves',
    });
  }
};

exports.getLeaveRequestsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'appliedAt', sortValue = -1, month, year, q, fields: fieldsRaw } = req.query;

    const query = {
      userId: employeeId,
      companyId: req.admin.companyId,
    };

    // Search filter
    const fieldsArray = fieldsRaw ? fieldsRaw.split(',') : [];
    if (q && fieldsArray.length > 0) {
      query.$or = fieldsArray.map((field) => ({
        [field]: { $regex: new RegExp(q, 'i') },
      }));
    }

    // Month-year filter on fromDate
    if (month && year) {
      const start = new Date(`${year}-${month}-01T00:00:00Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      query.fromDate = {
        $gte: start,
        $lt: end,
      };
    }

    // Query + pagination
    const [result, count] = await Promise.all([
      LeaveRequest.find(query)
        .populate({ path: 'plantId', select: 'name' })
        .populate({ path: 'userId', select: 'employeeCode email' })
        .populate({ path: 'leaveTypeId', select: 'name' })
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: parseInt(sortValue) }),

      LeaveRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      result,
      pagination: {
        page,
        pages: Math.ceil(count / limit),
        count,
      },
      message: count > 0 ? 'Leave requests found' : 'No leave requests',
    });
  } catch (err) {
    console.error('Error fetching leave requests by employee:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
