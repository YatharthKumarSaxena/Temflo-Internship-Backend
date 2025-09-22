const User = require('../../models/userModels/User');
const WalletTransaction = require('../../models/expenseModels/walletTransaction');
const ErrorHandler = require('../../utils/errorHandler');
const mongoose = require('mongoose');
const { MODEL_AFFECTED, MODULE, SUBMODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { WALLET_CREDITED, WALLET_ADDED, WALLET_STATUS_UPDATED, WALLET_REQUEST_CREATED, WALLET_REQUEST_APPROVED, WALLET_REQUEST_REJECTED } = require("@/config/activity.enums");
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

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

    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add wallet balance',
      });
    }

    // ❌ Removed populate of personalInfo & companyInfo (not in schema)
    const employee = await User.findOne({
      _id: employeeId,
      companyId,
    }).exec();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
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
    });

    // ------------------- EMAIL INTEGRATION -------------------
    if (employee.email) {
      const emailHtml = generateMasterTemplate({
        company_name: req.admin.companyName,
        user_name: employee.name || employee.employeeCode,
        event_name: masterTemplate.walletRequestApproved.event_name,
        action: masterTemplate.walletRequestApproved.action,
        status: masterTemplate.walletRequestApproved.status,
        message_intro: masterTemplate.walletRequestApproved.message_intro,
        details: {
          Amount: amount,
          Date: new Date().toLocaleString(),
          RequestID: transaction._id
        },
        actionbutton_text: masterTemplate.walletRequestApproved.actionbutton_text,
        actionlink: masterTemplate.walletRequestApproved.actionlink.replace('<APPROVED_REQUEST_LINK>', '#'),
        fallback_note: masterTemplate.walletRequestApproved.fallback_note,
        action_link: masterTemplate.walletRequestApproved.action_link.replace('<APPROVED_REQUEST_LINK>', '#'),
      });
      sendEmail(employee.email, masterTemplate.walletRequestApproved.subject, emailHtml);
    }

// Email to Admin (notification)
if (req.admin.email) {
  const emailHtmlAdmin = generateMasterTemplate({
    company_name: req.admin.companyName,
    user_name: req.admin.name || req.admin.employeeCode,
    event_name: masterTemplate.walletBalanceAdded.event_name,
    action: masterTemplate.walletBalanceAdded.action,
    status: masterTemplate.walletBalanceAdded.status,
    message_intro: `You have successfully added funds to ${employee.name || employee.employeeCode}'s wallet.`,
    details: {
      Amount: amount,
      Date: new Date().toLocaleString(),
      TransactionID: transaction._id,
      EmployeeID: employee._id,
      EmployeeEmail: employee.email
    },
    actionbutton_text: masterTemplate.walletBalanceAdded.actionbutton_text 
                      || 'View Wallet Balance',
    actionlink: masterTemplate.walletBalanceAdded.actionlink
                      ? masterTemplate.walletBalanceAdded.actionlink.replace('<BALANCE_LINK>', '#')
                      : '#', // fallback link
    fallback_note: masterTemplate.walletBalanceAdded.fallback_note 
                   || 'Login to ERPICA dashboard to view details.',
    action_link: masterTemplate.walletBalanceAdded.action_link
                      ? masterTemplate.walletBalanceAdded.action_link.replace('<BALANCE_LINK>', '#')
                      : '#',
  });
  sendEmail(
    req.admin.email, 
    masterTemplate.walletBalanceAdded.subject 
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
    const employeeId = req.admin._id; // currently logged-in user
    const companyId = req.admin.companyId;

    if (!amount || amount <= 0 || !requestMessage) {
      return res.status(400).json({ success: false, message: 'Amount and request message are required' });
    }

    if (req.admin.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Only employees can request wallet balance' });
    }

    const employee = await User.findById(employeeId)
      .select('plantId walletBalance walletStatus name email companyId')
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
      fileAffected: FILE.file_wallet,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_STATUS_UPDATED,
      actionDone: ACTIONS.update,
      oldData: { walletStatus: oldWalletStatus },
      newData: { walletStatus: 'pending_request' },
    });

    activityTracker({
      userId: employeeId,
      companyId,
      plantId,
      module: MODULE.expense,
      fileAffected: FILE.file_wallet,
      modelAffected: [MODEL_AFFECTED.model_wallet],
      eventType: WALLET_REQUEST_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: transaction.toObject(),
    });
// ------------------- EMAIL TO EMPLOYEE -------------------
if (employee && employee.email) {
  const emailHtmlEmployee = generateMasterTemplate({
    company_name: req.admin.companyName,
    user_name: employee.name || employee.employeeCode,
    event_name: masterTemplate.walletRequestCreated.event_name,
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
    actionlink: masterTemplate.walletRequestCreated.actionlink.replace('<REQUEST_LINK>', '#'),
    fallback_note: masterTemplate.walletRequestCreated.fallback_note,
    action_link: masterTemplate.walletRequestCreated.action_link.replace('<REQUEST_LINK>', '#'),
  });

  await sendEmail(
    employee.email,
    `Your Wallet Balance Request is Pending`,
    emailHtmlEmployee
  );
}

// ------------------- EMAIL TO SUPERVISOR -------------------
const supervisor = await User.findOne({
  companyId,
  role: { $in: ['admin', 'owner'] },
  plantId,
}).select('name email').exec();

if (supervisor && supervisor.email) {
  const emailHtml = generateMasterTemplate({
    company_name: req.admin.companyName,
    user_name: supervisor.name || supervisor.employeeCode,
    event_name: masterTemplate.walletRequestCreated.event_name,
    action: masterTemplate.walletRequestCreated.action,
    status: masterTemplate.walletRequestCreated.status,
    message_intro: `Employee ${employee.name || employee.employeeCode} has submitted a wallet balance request.`,
    details: {
      Amount: amount,
      Date: new Date().toLocaleString(),
      RequestID: transaction._id,
      EmployeeID: employee._id,
      EmployeeEmail: employee.email,
      RequestMessage: requestMessage,
    },
    actionbutton_text: masterTemplate.walletRequestCreated.actionbutton_text || 'View Wallet Request',
    actionlink: masterTemplate.walletRequestCreated.actionlink.replace('<REQUEST_LINK>', '#'),
    fallback_note: masterTemplate.walletRequestCreated.fallback_note,
    action_link: masterTemplate.walletRequestCreated.action_link.replace('<REQUEST_LINK>', '#'),
  });

  sendEmail(
    supervisor.email,
    `Wallet Request Submitted by ${employee.name || employee.employeeCode}`,
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

    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can process balance requests',
      });
    }

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
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_CREDITED,
        actionDone: ACTIONS.update,
        oldData: { balance: oldWalletBalance, walletStatus: oldWalletStatus },
        newData: { balance: balanceAfter, walletStatus: 'active' },
      });

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_REQUEST_APPROVED,
        actionDone: ACTIONS.update,
        oldData: oldTransactionData,
        newData: newTransactionData
      });

      // Select Email Template
      emailTemplate = masterTemplate.walletRequestApproved;

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
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_STATUS_UPDATED,
        actionDone: ACTIONS.update,
        oldData: { walletStatus: oldWalletStatus },
        newData: { walletStatus: 'active' },
      });

      activityTracker({
        userId: req.admin._id,
        companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.expense,
        fileAffected: FILE.file_wallet,
        modelAffected: [MODEL_AFFECTED.model_wallet],
        eventType: WALLET_REQUEST_REJECTED,
        actionDone: ACTIONS.update,
        oldData: oldTransactionData,
        newData: newTransactionData
      });

      // Select Email Template
      emailTemplate = masterTemplate.walletRequestRejected;
    }

    // ------------------- EMAIL INTEGRATION -------------------
    const txnLink = `${process.env.WALLET_URL}/transactions/${transaction._id}`;

    // Email to Employee
    if (employee.email) {
      const emailDataEmployee = generateMasterTemplate({
        company_name: req.admin.companyName,
        user_name: employee.name || employee.employeeCode,
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
        actionlink: emailTemplate.actionlink.replace(/<.*_REQUEST_LINK>/, txnLink),
        fallback_note: emailTemplate.fallback_note,
        action_link: emailTemplate.action_link.replace(/<.*_REQUEST_LINK>/, txnLink),
      });
      sendEmail(employee.email, emailTemplate.subject, emailDataEmployee);
    }

    // Email to Admin (notification)
    if (req.admin.email) {
      const emailDataAdmin = generateMasterTemplate({
        company_name: req.admin.companyName,
        user_name: req.admin.name || req.admin.employeeCode,
        event_name: emailTemplate.event_name,
        action: emailTemplate.action,
        status: emailTemplate.status,
        message_intro: `You have ${action} a wallet balance request for ${employee.name || employee.employeeCode}.`,
        details: {
          Amount: transaction.amount,
          Date: transaction.processedAt.toLocaleString(),
          RequestID: transaction._id,
          EmployeeID: employee._id,
          EmployeeEmail: employee.email,
          AdminNotes: adminNotes || "No notes provided"
        },
        actionbutton_text: emailTemplate.actionbutton_text || (action === 'approve' ? 'View Approved Request' : 'View Rejected Request'),
        actionlink: emailTemplate.actionlink.replace(/<.*_REQUEST_LINK>/, txnLink),
        fallback_note: emailTemplate.fallback_note,
        action_link: emailTemplate.action_link.replace(/<.*_REQUEST_LINK>/, txnLink),
      });
      sendEmail(req.admin.email, `Wallet Request ${action.charAt(0).toUpperCase() + action.slice(1)} for ${employee.name || employee.employeeCode}`, emailDataAdmin);
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