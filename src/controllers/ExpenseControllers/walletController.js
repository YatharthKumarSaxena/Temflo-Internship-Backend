const User = require('../../models/userModels/User');
const WalletTransaction = require('../../models/expenseModels/walletTransaction');
const ErrorHandler = require('../../utils/errorHandler');
const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WALLET_CREDITED, WALLET_ADDED, WALLET_STATUS_UPDATED, WALLET_REQUEST_CREATED, WALLET_REQUEST_APPROVED, WALLET_REQUEST_REJECTED } = require("@/config/activity.enums");
const { expenseTemplate } = require("@/config/emailTemplates/expenseTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

const { getFullName } = require("@/utils/commonFunctions");

// Get base URL from environment
const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

// Add balance to employee wallet (Admin/Owner only)
exports.addWalletBalance = async (req, res, next) => {
  try {
    const { employeeId, amount, description = 'Balance added by admin' } = req.body;
    const plantId = req.headers['plant-id'];
    const companyId = req.admin.companyId;

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


    const employee = await User.findOne({
      _id: employeeId,
      companyId,
    }).select('name email employeeCode walletBalance walletStatus employeeInfo companyId').exec();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Fallback fix if companyId missing
    if (!employee.companyId) {
      console.warn(`⚠️ Employee ${employeeId} missing companyId. Setting to admin's companyId.`);
      employee.companyId = companyId;
    }

    const currentBalance = employee.walletBalance || 0;
    const newBalance = currentBalance + parseFloat(amount);

    employee.walletBalance = newBalance;
    employee.lastWalletUpdate = new Date();
    await employee.save();


    const transaction = new WalletTransaction({
      employeeId,
      amount: parseFloat(amount),
      balanceBefore: currentBalance, // required field
      balanceAfter: newBalance, // already included
      transactionType: 'credit', // required field
      description,
      companyId,
      plantId,
      createdBy: req.admin._id,
      processedBy: req.admin._id, // required field
      createdAt: new Date(),
    });

    await transaction.save();


    // ---------------- ACTIVITY TRACKER ----------------
    activityTracker({
      userId: req.admin._id,
      companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.expense,
      subModuleAffected: null,
      fileAffected: FILE.file_wallet,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_CREDITED,
      actionDone: ACTIONS.update,
      oldData: { plantId, balance: currentBalance },
      newData: { balance: newBalance, added: parseFloat(amount) },
      description: `Wallet credited ₹${amount} to ${employee.name || employee.employeeCode} by ${getFullName(req.admin.employeeInfo)}`
    });

    activityTracker({
      userId: req.admin._id,
      companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.expense,
      subModuleAffected: null,
      fileAffected: FILE.file_wallet,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_ADDED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: transaction.toObject(),
      description: `Wallet transaction ₹${amount} created for ${employee.name || employee.employeeCode} by ${getFullName(req.admin.employeeInfo)}`
    });

    // Define wallet link for reuse
    const walletLink = `${baseUrl}/dashboard/wallet`;

    // ------------------- EMAIL INTEGRATION -------------------
    if (employee.email) {
      const emailHtml = generateMasterTemplate({
        user_name: getFullName(employee.employeeInfo),
        event_name: expenseTemplate.walletRequestApproved.event_name,
        action: expenseTemplate.walletRequestApproved.action,
        status: expenseTemplate.walletRequestApproved.status,
        message_intro: expenseTemplate.walletRequestApproved.message_intro,
        details: {
          Amount: amount,
          Date: new Date().toLocaleString(),
          RequestID: transaction._id
        },
        actionbutton_text: expenseTemplate.walletRequestApproved.actionbutton_text,
        actionlink: walletLink,
        fallback_note: expenseTemplate.walletRequestApproved.fallback_note,
        action_link: walletLink,
      });
      sendEmail(employee.email, expenseTemplate.walletRequestApproved.subject, emailHtml);
    }

    // Email to Admin (notification)
    if (req.admin.email) {
      const emailHtmlAdmin = generateMasterTemplate({
        user_name: getFullName(req.admin.employeeInfo),
        event_name: expenseTemplate.walletBalanceAdded.event_name,
        action: expenseTemplate.walletBalanceAdded.action,
        status: expenseTemplate.walletBalanceAdded.status,
        message_intro: `You have successfully added funds to Employee's wallet whose Employee Code is ${employee.employeeCode}.`,
        details: {
          Amount: amount,
          Date: new Date().toLocaleString(),
          TransactionID: transaction._id,
          EmployeeID: employee._id,
          EmployeeEmail: employee.email
        },
        actionbutton_text: expenseTemplate.walletBalanceAdded.actionbutton_text || 'View Wallet Balance',
        actionlink: walletLink,
        fallback_note: expenseTemplate.walletBalanceAdded.fallback_note || 'Login to ERPICA dashboard to view details.',
        action_link: walletLink,
      });
      sendEmail(
        req.admin.email,
        expenseTemplate.walletBalanceAdded.subject
        || `Wallet Balance Added for Employee whose Id: ${employee._id || employee.employeeCode}`,
        emailHtmlAdmin
      );
    }
    return res.status(200).json({
      success: true,
      message: 'Wallet balance added successfully',
      data: {
        employeeId,
        previousBalance: currentBalance,
        addedAmount: parseFloat(amount),
        newBalance,
        transaction,
      },
    });
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




    const employee = await User.findOne({
      _id: employeeId,
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
    const employeeId = req.admin._id; // currently logged-in user
    const companyId = req.admin.companyId;

    if (!amount || amount <= 0 || !requestMessage) {
      return res.status(400).json({ success: false, message: 'Amount and request message are required' });
    }

    if (req.admin.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Only employees can request wallet balance' });
    }

    const employee = await User.findById(employeeId)
      .select('plantId walletBalance walletStatus name email companyId employeeInfo')
      .exec();

    if (!employee || !employee.plantId) {
      return res.status(400).json({ success: false, message: 'Employee plant assignment not found' });
    }

    const plantId = employee.plantId;
    if (!employee.companyId) employee.companyId = companyId;

    const existingRequest = await WalletTransaction.findOne({
      employeeId,
      companyId,
      transactionType: 'credit',
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending balance request' });
    }

    const oldWalletStatus = employee.walletStatus;
    employee.walletStatus = 'pending_request';
    await employee.save();

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

    // Activity tracker
    activityTracker({
      userId: employeeId,
      companyId,
      plantId,
      module: MODULE.expense,
      subModuleAffected: null,
      fileAffected: FILE.file_wallet,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_STATUS_UPDATED,
      actionDone: ACTIONS.update,
      oldData: { walletStatus: oldWalletStatus },
      newData: { walletStatus: 'pending_request' },
      description: `Wallet status updated to pending request by ${getFullName(employee.employeeInfo)}`
    });

    activityTracker({
      userId: employeeId,
      companyId,
      plantId,
      module: MODULE.expense,
      fileAffected: FILE.file_wallet,
      subModuleAffected: null,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_REQUEST_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: transaction.toObject(),
      description: `Wallet balance request ₹${amount} created by ${getFullName(employee.employeeInfo)}`
    });
    // Define wallet link for reuse
    const walletLink = `${baseUrl}/dashboard/wallet`;

    // ------------------- EMAIL TO EMPLOYEE -------------------
    if (employee && employee.email) {
      const emailHtmlEmployee = generateMasterTemplate({
        user_name: getFullName(employee.employeeInfo),
        event_name: expenseTemplate.walletRequestCreated.event_name,
        action: "Your wallet balance request has been submitted",
        status: "Pending",
        message_intro: `Your wallet balance request of ₹${amount} has been submitted successfully and is pending supervisor approval.`,
        details: {
          Amount: amount,
          Date: new Date().toLocaleString(),
          RequestID: transaction._id,
          Status: "Pending",
        },
        actionbutton_text: "View Request",
        actionlink: walletLink,
        fallback_note: expenseTemplate.walletRequestCreated.fallback_note,
        action_link: walletLink,
      });

      sendEmail(
        employee.email,
        `Your Wallet Balance Request is Pending`,
        emailHtmlEmployee
      );
    }

    // ------------------- EMAIL TO SUPERVISOR -------------------
    const supervisor = await User.findOne({
      companyId,
      supervisor: employee.supervisor,
      plantId,
    }).select('name email').exec();

    if (supervisor && supervisor.email) {
      const emailHtml = generateMasterTemplate({
        user_name: getFullName(supervisor.employeeInfo),
        event_name: expenseTemplate.walletRequestCreated.event_name,
        action: expenseTemplate.walletRequestCreated.action,
        status: expenseTemplate.walletRequestCreated.status,
        message_intro: `Employee whose Employee Code is ${employee.employeeCode} has submitted a wallet balance request.`,
        details: {
          Amount: amount,
          Date: new Date().toLocaleString(),
          RequestID: transaction._id,
          EmployeeID: employee._id,
          EmployeeEmail: employee.email,
          RequestMessage: requestMessage,
        },
        actionbutton_text: expenseTemplate.walletRequestCreated.actionbutton_text || 'View Wallet Request',
        actionlink: walletLink,
        fallback_note: expenseTemplate.walletRequestCreated.fallback_note,
        action_link: walletLink,
      });

      sendEmail(
        supervisor.email,
        `Wallet Request Submitted by ${getFullName(employee.employeeInfo)}`,
        emailHtml
      );
    }

    return res.status(200).json({
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

// Approve/Reject balance request (Admin/Owner only) with email
exports.processBalanceRequest = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { transactionId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
    const companyId = req.admin.companyId;

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

    const oldTransactionData = {
      _id: transaction._id,
      status: transaction.status,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      processedBy: transaction.processedBy,
      processedAt: transaction.processedAt,
      adminNotes: transaction.adminNotes,
    };

    const oldWalletStatus = employee.walletStatus;
    const oldWalletBalance = employee.walletBalance || 0;

    let emailTemplate;

    if (action === 'approve') {
      const balanceAfter = oldWalletBalance + transaction.amount;

      // Update employee wallet
      employee.walletBalance = balanceAfter;
      employee.walletStatus = 'active';
      await employee.save({ session });

      // Update transaction
      transaction.status = 'completed';
      transaction.balanceBefore = oldWalletBalance;
      transaction.balanceAfter = balanceAfter;
      transaction.adminNotes = adminNotes;
      transaction.processedAt = new Date();
      transaction.processedBy = req.admin._id;
      await transaction.save({ session });

      const newTransactionData = { ...transaction.toObject() };

      // Activity Tracker
      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        subModuleAffected: null,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_CREDITED,
        actionDone: ACTIONS.update,
        oldData: { balance: oldWalletBalance, walletStatus: oldWalletStatus },
        newData: { balance: balanceAfter, walletStatus: 'active' },
        description: `Wallet request approved and ₹${transaction.amount} credited to ${getFullName(employee.employeeInfo) || employee.name || employee.employeeCode} by ${getFullName(req.admin.employeeInfo)}`
      });

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        subModuleAffected: null,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_REQUEST_APPROVED,
        actionDone: ACTIONS.update,
        oldData: oldTransactionData,
        newData: newTransactionData,
        description: `Wallet request of ₹${transaction.amount} approved for ${getFullName(employee.employeeInfo)} by ${getFullName(req.admin.employeeInfo)}`
      });

      // Select Email Template
      emailTemplate = expenseTemplate.walletRequestApproved;

    } else if (action === 'reject') {
      // Update employee wallet status
      employee.walletStatus = 'active';
      await employee.save({ session });

      transaction.status = 'failed';
      transaction.adminNotes = adminNotes;
      transaction.processedAt = new Date();
      transaction.processedBy = req.admin._id;
      await transaction.save({ session });

      const newTransactionData = { ...transaction.toObject() };

      // Activity Tracker
      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        subModuleAffected: null,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_STATUS_UPDATED,
        actionDone: ACTIONS.update,
        oldData: { walletStatus: oldWalletStatus },
        newData: { walletStatus: 'active' },
        description: `Wallet status updated to active after request rejection for ${getFullName(employee.employeeInfo) || employee.name || employee.employeeCode} by ${getFullName(req.admin.employeeInfo)}`
      });

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        subModuleAffected: null,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_REQUEST_REJECTED,
        actionDone: ACTIONS.update,
        oldData: oldTransactionData,
        newData: newTransactionData,
        description: `Wallet request of ₹${transaction.amount} rejected for ${getFullName(employee.employeeInfo) || employee.name || employee.employeeCode} by ${getFullName(req.admin.employeeInfo)}`
      });

      // Select Email Template
      emailTemplate = expenseTemplate.walletRequestRejected;
    }

    // ------------------- EMAIL INTEGRATION -------------------
    const walletLink = `${baseUrl}/dashboard/wallet`;

    // Email to Employee
    if (employee.email) {
      const emailDataEmployee = generateMasterTemplate({
        user_name: getFullName(employee.employeeInfo),
        event_name: emailTemplate.event_name,
        action: emailTemplate.action,
        status: emailTemplate.status,
        message_intro: emailTemplate.message_intro,
        details: {
          Amount: transaction.amount,
          Date: transaction.processedAt.toLocaleString(),
          RequestID: transaction._id,
          AdminNotes: adminNotes || "No notes provided"
        },
        actionbutton_text: emailTemplate.actionbutton_text || (action === 'approve' ? 'View Approved Request' : 'View Rejected Request'),
        actionlink: walletLink,
        fallback_note: emailTemplate.fallback_note,
        action_link: walletLink,
      });
      sendEmail(employee.email, emailTemplate.subject, emailDataEmployee);
    }

    // Email to Admin (notification)
    if (req.admin.email) {
      const emailDataAdmin = generateMasterTemplate({
        user_name: getFullName(req.admin.employeeInfo),
        event_name: emailTemplate.event_name,
        action: emailTemplate.action,
        status: emailTemplate.status,
        message_intro: `You have ${action} a wallet balance request for ${getFullName(employee.employeeInfo)} whose Employee Code is ${employee.employeeCode}.`,
        details: {
          Amount: transaction.amount,
          Date: transaction.processedAt.toLocaleString(),
          RequestID: transaction._id,
          EmployeeID: employee._id,
          EmployeeEmail: employee.email,
          AdminNotes: adminNotes || "No notes provided"
        },
        actionbutton_text: emailTemplate.actionbutton_text || (action === 'approve' ? 'View Approved Request' : 'View Rejected Request'),
        actionlink: walletLink,
        fallback_note: emailTemplate.fallback_note,
        action_link: walletLink,
      });
      sendEmail(req.admin.email, `Wallet Request ${action.charAt(0).toUpperCase() + action.slice(1)} for ${getFullName(employee.employeeInfo)}`, emailDataAdmin);
    }

    await session.commitTransaction();

    return res.status(200).json({
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

    const query = {
      companyId,
      role: { $in: ['employee', 'admin'] },
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