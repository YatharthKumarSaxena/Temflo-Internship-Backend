const User = require('../../models/userModels/User');
const WalletTransaction = require('../../models/expenseModels/walletTransaction');
const ErrorHandler = require('../../utils/errorHandler');
const mongoose = require('mongoose');

// Add balance to employee wallet (Admin/Owner only)
exports.addWalletBalance = async (req, res, next) => {
  try {
    const { employeeId, amount, description = 'Balance added by admin' } = req.body;
    const plantId = req.headers['plant-id'];
    const companyId = req.admin.companyId;

    // Validate required fields
    if (!employeeId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and amount are required',
      });
    }

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID is required in headers',
      });
    }

    // Check if the admin has permission
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add wallet balance',
      });
    }

    // Find the employee
    const employee = await User.findOne({
      _id: employeeId,
      companyId: companyId,
    })
      .populate('personalInfo')
      .populate('companyInfo')
      .exec();

    if (employee) {
      // Calculate new balance
      const currentBalance = employee.walletBalance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      // Update user's wallet balance
      const updateResult = await User.updateOne(
        { _id: employeeId },
        {
          $set: {
            walletBalance: newBalance,
          },
        }
      );

      // Create a transaction record
      const transaction = new WalletTransaction({
        employeeId: employeeId,
        amount: parseFloat(amount),
        type: 'credit',
        description: description,
        balanceAfter: newBalance,
        companyId: companyId,
        plantId: plantId,
        createdBy: req.admin.id,
        createdAt: new Date(),
      });

      const savedTransaction = await transaction.save();

      res.status(200).json({
        success: true,
        message: 'Wallet balance added successfully',
        data: {
          employeeId,
          previousBalance: currentBalance,
          addedAmount: parseFloat(amount),
          newBalance,
          transaction: savedTransaction,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
  } catch (error) {
    console.error('Add wallet balance error:', error);
    console.error('Error stack:', error.stack);
    return next(ErrorHandler.internalServer(`Error adding wallet balance: ${error.message}`));
  }
};

// Get employee wallet balance
exports.getWalletBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.admin.companyId;

    let targetEmployeeId = employeeId;

    // If no employeeId provided or employee role, use their own ID
    if (!employeeId || req.admin.role === 'employee') {
      targetEmployeeId = req.admin._id;
    }

    const employee = await User.findOne({
      _id: targetEmployeeId,
      companyId,
      role: 'employee',
      removed: false,
    }).select('name employeeCode walletBalance walletStatus lastWalletUpdate');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employeeId: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode,
        walletBalance: employee.walletBalance || 0,
        walletStatus: employee.walletStatus || 'active',
        lastWalletUpdate: employee.lastWalletUpdate,
      },
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return next(ErrorHandler.internalServer('Error fetching wallet balance'));
  }
};

// Request more wallet balance (Employee only)
exports.requestWalletBalance = async (req, res, next) => {
  try {
    const { amount, requestMessage } = req.body;
    const companyId = req.admin.companyId;
    const employeeId = req.admin._id;

    // Validate input
    if (!amount || amount <= 0 || !requestMessage) {
      return res.status(400).json({
        success: false,
        message: 'Amount and request message are required',
      });
    }

    // Check if user is employee
    if (req.admin.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can request wallet balance',
      });
    }

    // Get employee's plantId from their profile
    const employee = await User.findById(employeeId).select('plantId walletBalance');
    if (!employee || !employee.plantId) {
      return res.status(400).json({
        success: false,
        message: 'Employee plant assignment not found',
      });
    }

    const plantId = employee.plantId;

    // Check if there's already a pending request
    const existingRequest = await WalletTransaction.findOne({
      employeeId,
      companyId,
      transactionType: 'credit',
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending balance request',
      });
    }

    // Update employee wallet status
    await User.findByIdAndUpdate(employeeId, {
      walletStatus: 'pending_request',
    });

    // Create pending transaction record
    const transaction = new WalletTransaction({
      companyId,
      plantId,
      employeeId,
      transactionType: 'credit',
      amount,
      balanceBefore: employee.walletBalance || 0,
      balanceAfter: (employee.walletBalance || 0) + amount,
      description: `Balance request by employee`,
      requestMessage,
      processedBy: employeeId,
      status: 'pending',
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Balance request submitted successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Request wallet balance error:', error);
    return next(ErrorHandler.internalServer('Error submitting balance request'));
  }
};

// Get wallet transaction history
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, status, transactionType, startDate, endDate } = req.query;
    const companyId = req.admin.companyId;

    let targetEmployeeId = employeeId;

    // If employee role, only show their own transactions
    if (req.admin.role === 'employee') {
      targetEmployeeId = req.admin._id;
    }

    const query = {
      companyId,
    };

    if (targetEmployeeId) {
      query.employeeId = targetEmployeeId;
    }

    if (status && status !== '') {
      query.status = status;
    }

    if (transactionType && transactionType !== '') {
      query.transactionType = transactionType;
    }

    // Add date range filtering
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'), // End of day
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate + 'T23:59:59.999Z') };
    }

    const skip = (page - 1) * limit;

    const transactions = await WalletTransaction.find(query)
      .populate('employeeId', 'name employeeCode')
      .populate('processedBy', 'name role')
      .populate('relatedExpenseId', 'amount category status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WalletTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    return next(ErrorHandler.internalServer('Error fetching wallet transactions'));
  }
};

// Approve/Reject balance request (Admin/Owner only)
exports.processBalanceRequest = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { transactionId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
    const companyId = req.admin.companyId;

    // Check if user has permission (admin/owner only)
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can process balance requests',
      });
    }

    // Find the pending transaction
    const transaction = await WalletTransaction.findOne({
      _id: transactionId,
      companyId,
      transactionType: 'credit',
      status: 'pending',
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Pending transaction not found',
      });
    }

    const employee = await User.findById(transaction.employeeId).session(session);

    if (action === 'approve') {
      const balanceBefore = employee.walletBalance || 0;
      const balanceAfter = balanceBefore + transaction.amount;

      // Update employee wallet balance
      await User.findByIdAndUpdate(
        transaction.employeeId,
        {
          walletBalance: balanceAfter,
          lastWalletUpdate: new Date(),
          walletStatus: 'active',
        },
        { session }
      );

      // Update transaction
      await WalletTransaction.findByIdAndUpdate(
        transactionId,
        {
          status: 'completed',
          balanceBefore,
          balanceAfter,
          adminNotes,
          processedAt: new Date(),
          processedBy: req.admin._id,
        },
        { session }
      );
    } else if (action === 'reject') {
      // Update employee status
      await User.findByIdAndUpdate(transaction.employeeId, { walletStatus: 'active' }, { session });

      // Update transaction
      await WalletTransaction.findByIdAndUpdate(
        transactionId,
        {
          status: 'failed',
          adminNotes,
          processedAt: new Date(),
          processedBy: req.admin._id,
        },
        { session }
      );
    } else {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"',
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Balance request ${action}d successfully`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Process balance request error:', error);
    return next(ErrorHandler.internalServer('Error processing balance request'));
  } finally {
    session.endSession();
  }
};

// Get all employees with their wallet balances (Admin/Owner only)
exports.getAllEmployeeBalances = async (req, res, next) => {
  try {
    const { plantId } = req.headers;
    const companyId = req.admin.companyId;

    // Check if user has permission (admin/owner only)
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can view all employee balances',
      });
    }

    const query = {
      companyId,
      role: 'employee',
      removed: false,
    };

    if (plantId) {
      query.plantId = plantId;
    }

    const employees = await User.find(query)
      .select('name employeeCode walletBalance walletStatus lastWalletUpdate plantId')
      .populate('plantId', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Get all employee balances error:', error);
    return next(ErrorHandler.internalServer('Error fetching employee balances'));
  }
};
