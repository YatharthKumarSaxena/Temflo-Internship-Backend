const Expense = require('../../models/expenseModels/expense');
const ExpensePolicy = require('../../models/expenseModels/expensePolicy');
const mongoose = require('mongoose');
const User = require('../../models/userModels/User');
const WalletTransaction = require('../../models/expenseModels/walletTransaction');
const ErrorHandler = require('../../utils/errorHandler');

exports.createExpenseCategory = async (req, res) => {
  try {
    const { expenseCategory, subCategories, plantId } = req.body;

    if (!expenseCategory || !plantId) {
      return res
        .status(400)
        .json({ success: false, message: 'Expense Category and Plant ID are required.' });
    }

    let ExpenseCategoryRecord = await ExpensePolicy.findOne({
      companyId: req.admin.companyId,
      plantId: plantId,
    });

    if (!ExpenseCategoryRecord) {
      // If no record exists, create a new one
      ExpenseCategoryRecord = new ExpensePolicy({
        companyId: req.admin.companyId,
        plantId: plantId,
        expensePolicies: [],
      });
    }

    // Push new expense policy to array
    ExpenseCategoryRecord.expensePolicies.push({
      category: expenseCategory,
      subCategory: subCategories || [],
    });

    // Save the updated record
    await ExpenseCategoryRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Expense Category has been added',
      ExpenseCategoryRecord,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpenseCategory = async (req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { plantId } = req.query;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'Plant ID is required' });
    }

    const expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });

    if (!expenseCategoryRecord || !expenseCategoryRecord.expensePolicies.length) {
      return res.status(200).json({
        success: true,
        message: 'No expense category found for this plant',
        expensePolicies: [],
      });
    }

    res.status(200).json({
      success: true,
      expensePolicies: expenseCategoryRecord.expensePolicies,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpenseForm = async (req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { plantId } = req.query;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'Plant ID is required' });
    }

    const expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });

    if (!expenseCategoryRecord) {
      return res.status(200).json({
        success: true,
        message: 'No expense category found for this plant',
        expenseForm: [],
      });
    }

    res.status(200).json({
      success: true,
      expenseForm: expenseCategoryRecord.fields || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveExpenseForm = async (req, res) => {
  try {
    const companyId = req.admin.companyId;
    const { plantId, fields } = req.body;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'Plant ID is required' });
    }

    let expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });

    if (expenseCategoryRecord) {
      expenseCategoryRecord.fields = fields || [];
      await expenseCategoryRecord.save();
    } else {
      expenseCategoryRecord = new ExpensePolicy({
        companyId,
        plantId,
        fields: fields || [],
        expensePolicies: [],
      });
      await expenseCategoryRecord.save();
    }

    res.status(200).json({
      success: true,
      message: 'Expense form saved successfully',
      expenseForm: expenseCategoryRecord.fields,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateExpenseCategory = async (req, res, next) => {
  try {
    const companyId = req.admin.companyId;
    const { plantId, expenseId, expenseCategory, subCategories } = req.body;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'Plant ID is required' });
    }

    // Find the expense category document for the company and plant
    const expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });

    if (!expenseCategoryRecord) {
      return res
        .status(400)
        .json({ success: false, message: 'No Expense Category found for this plant' });
    }

    // Find the specific category to update by ID
    const expenseCategoryToUpdate = expenseCategoryRecord.expensePolicies.id(expenseId);

    if (!expenseCategoryToUpdate) {
      return res.status(400).json({ success: false, message: 'Expense Category not found' });
    }

    // Update the fields
    expenseCategoryToUpdate.category = expenseCategory || expenseCategoryToUpdate.category;
    expenseCategoryToUpdate.subCategory = subCategories || expenseCategoryToUpdate.subCategory;

    // Save the updated record
    await expenseCategoryRecord.save();

    res.status(200).json({
      success: true,
      message: 'Expense Category updated successfully',
      expenseCategoryRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteExpenseRecord = async (req, res, next) => {
  try {
    const companyId = req.admin.companyId;
    const { expenseId } = req.params;
    const { plantId } = req.body;

    if (!plantId) {
      return res.status(400).json({ success: false, message: 'Plant ID is required' });
    }

    // Find the record for this company and plant
    const expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });

    if (!expenseCategoryRecord) {
      return res
        .status(400)
        .json({ success: false, message: 'No Expense Category found for this plant' });
    }

    // Filter out the category to delete
    const updatedPolicies = expenseCategoryRecord.expensePolicies.filter(
      (exp) => exp._id.toString() !== expenseId
    );

    // If no change, category not found
    if (updatedPolicies.length === expenseCategoryRecord.expensePolicies.length) {
      return res.status(400).json({ success: false, message: 'Expense Category not found' });
    }

    // Save updated record
    expenseCategoryRecord.expensePolicies = updatedPolicies;
    await expenseCategoryRecord.save();

    res.status(200).json({
      success: true,
      message: 'Expense Category deleted successfully',
      expenseCategoryRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.claimExpense = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      plantId,
      employeeId,
      category,
      subCategory,
      amount,
      formData: formDataRaw,
      deductFromWallet,
    } = req.body;

    const companyId = req.admin.companyId;
    const expenseAmount = parseFloat(amount);
    const shouldDeductFromWallet = deductFromWallet === 'true' || deductFromWallet === true;

    // Parse formData string (from form-data payload)
    let formData;
    try {
      formData = typeof formDataRaw === 'string' ? JSON.parse(formDataRaw) : formDataRaw;
    } catch (err) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid formData JSON' });
    }

    // Get uploaded file URLs from Cloudinary
    const fileUrls = req.files?.map((file) => file.path) || [];

    if (!expenseAmount || !fileUrls.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Amount and at least one file are required',
      });
    }

    // Find the current user (submitter) and check wallet balance
    const currentUser = await User.findOne({
      _id: req.admin._id,
      companyId,
      removed: false,
    }).session(session);

    if (!currentUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Current user not found',
      });
    }

    // Determine expense submitter and approver based on user role
    let expenseSubmitterId, expenseApproverId;

    if (req.admin.role === 'employee') {
      // Employee submitting expense
      expenseSubmitterId = req.admin._id;

      // First try to find admin/owner in the same plant
      let autoApprover = await User.findOne({
        companyId,
        plantId,
        role: { $in: ['admin', 'owner'] },
        removed: false,
      }).session(session);

      // If no admin/owner found in the same plant, find any admin/owner in the company
      if (!autoApprover) {
        autoApprover = await User.findOne({
          companyId,
          role: { $in: ['admin', 'owner'] },
          removed: false,
        }).session(session);
      }

      if (!autoApprover) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'No admin or owner found for approval in this company',
        });
      }

      expenseApproverId = autoApprover._id;
    } else {
      // Admin/Owner submitting expense for an employee
      if (!employeeId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required for admin/owner expense submission',
        });
      }
      expenseSubmitterId = req.admin._id;
      expenseApproverId = employeeId; // This is the selected employee for admin submissions
    }

    // Create the expense record
    const newExpense = new Expense({
      employeeId: expenseSubmitterId, // The person submitting the expense
      approver: expenseApproverId, // The person who should approve it
      companyId,
      plantId,
      category,
      subCategory,
      amount: expenseAmount,
      files: fileUrls,
      formData,
      walletDeducted: shouldDeductFromWallet, // Track if wallet was deducted
    });

    await newExpense.save({ session });

    let walletTransactionData = null;

    // Only process wallet deduction if requested and user is employee
    if (shouldDeductFromWallet && req.admin.role === 'employee') {
      const currentWalletBalance = currentUser.walletBalance || 0;

      // Check if employee has sufficient wallet balance
      if (currentWalletBalance < expenseAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance for deduction. Available: ₹${currentWalletBalance}, Required: ₹${expenseAmount}`,
          data: {
            availableBalance: currentWalletBalance,
            requestedAmount: expenseAmount,
            shortfall: expenseAmount - currentWalletBalance,
          },
        });
      }

      // Check wallet status
      if (currentUser.walletStatus === 'suspended') {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Your wallet has been suspended. Please contact admin.',
        });
      }

      // Deduct amount from wallet balance for employees only
      const balanceAfter = currentWalletBalance - expenseAmount;

      await User.findByIdAndUpdate(
        expenseSubmitterId,
        {
          walletBalance: balanceAfter,
          lastWalletUpdate: new Date(),
        },
        { session }
      );

      // Create wallet transaction record for the deduction
      const walletTransaction = new WalletTransaction({
        companyId,
        plantId,
        employeeId: expenseSubmitterId,
        transactionType: 'debit',
        amount: expenseAmount,
        balanceBefore: currentWalletBalance,
        balanceAfter,
        description: `Expense claim - ${category}${subCategory ? ` (${subCategory})` : ''}`,
        relatedExpenseId: newExpense._id,
        processedBy: expenseSubmitterId,
        status: 'completed',
      });

      await walletTransaction.save({ session });

      walletTransactionData = {
        previous: currentWalletBalance,
        current: balanceAfter,
        deducted: expenseAmount,
      };
    } else if (
      shouldDeductFromWallet &&
      (req.admin.role === 'admin' || req.admin.role === 'owner')
    ) {
      // Admin/Owner deducting from selected employee's wallet
      const targetEmployee = await User.findOne({
        _id: expenseApproverId, // This is the selected employee for admin submissions
        companyId,
        removed: false,
      }).session(session);

      if (!targetEmployee) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Selected employee not found',
        });
      }

      const employeeWalletBalance = targetEmployee.walletBalance || 0;

      // Check if selected employee has sufficient wallet balance
      if (employeeWalletBalance < expenseAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance for selected employee. Available: ₹${employeeWalletBalance}, Required: ₹${expenseAmount}`,
          data: {
            availableBalance: employeeWalletBalance,
            requestedAmount: expenseAmount,
            shortfall: expenseAmount - employeeWalletBalance,
          },
        });
      }

      // Check selected employee's wallet status
      if (targetEmployee.walletStatus === 'suspended') {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: "Selected employee's wallet has been suspended.",
        });
      }

      // Deduct amount from selected employee's wallet balance
      const balanceAfter = employeeWalletBalance - expenseAmount;

      await User.findByIdAndUpdate(
        expenseApproverId, // The selected employee for admin submissions
        {
          walletBalance: balanceAfter,
          lastWalletUpdate: new Date(),
        },
        { session }
      );

      // Create wallet transaction record for the deduction
      const walletTransaction = new WalletTransaction({
        companyId,
        plantId,
        employeeId: expenseApproverId, // The employee whose wallet was debited
        transactionType: 'debit',
        amount: expenseAmount,
        balanceBefore: employeeWalletBalance,
        balanceAfter,
        description: `Expense claim by admin - ${category}${
          subCategory ? ` (${subCategory})` : ''
        }`,
        relatedExpenseId: newExpense._id,
        processedBy: req.admin._id, // Admin who processed
        status: 'completed',
      });

      await walletTransaction.save({ session });

      walletTransactionData = {
        previous: employeeWalletBalance,
        current: balanceAfter,
        deducted: expenseAmount,
        employeeName: targetEmployee.name || targetEmployee.employeeCode,
      };
    }

    await session.commitTransaction();

    const responseData = {
      expenseRecord: newExpense,
      message:
        shouldDeductFromWallet && req.admin.role === 'employee'
          ? 'Expense submitted and amount deducted from wallet successfully'
          : shouldDeductFromWallet && (req.admin.role === 'admin' || req.admin.role === 'owner')
          ? `Expense submitted and amount deducted from ${
              walletTransactionData?.employeeName || 'selected employee'
            }'s wallet successfully`
          : 'Expense submitted successfully (no wallet deduction)',
    };

    if (walletTransactionData) {
      responseData.walletBalance = walletTransactionData;
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: responseData.message,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Claim expense error:', error);
    return next(ErrorHandler.internalServer('Error submitting expense'));
  } finally {
    session.endSession();
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const {
      sortBy = 'submittedAt',
      sortValue = -1,
      filter,
      equal,
      q: searchQuery = '',
      startDate,
      endDate,
    } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    let fields = [];
    let employeeIds = [];
    let approverIds = [];

    // Search logic
    if (searchQuery && fieldsArray.length > 0) {
      for (const field of fieldsArray) {
        if (field === 'employeeId.employeeCode') {
          employeeIds = await User.find({
            employeeCode: { $regex: new RegExp(searchQuery, 'i') },
          }).distinct('_id');
        } else if (field === 'approver.employeeCode') {
          approverIds = await User.find({
            employeeCode: { $regex: new RegExp(searchQuery, 'i') },
          }).distinct('_id');
        } else {
          fields.push({ [field]: { $regex: new RegExp(searchQuery, 'i') } });
        }
      }
    }

    // Base query
    const query = {
      companyId: req.admin.companyId,
      plantId: req.params.plantId,
    };

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.submittedAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Filter
    if (filter && equal) {
      query[filter] = equal;
    }

    // OR condition for search fields
    if (fields.length > 0) {
      query.$or = fields;
    }

    if (employeeIds.length || approverIds.length) {
      query.$or = [
        ...(query.$or || []),
        ...(employeeIds.length ? [{ employeeId: { $in: employeeIds } }] : []),
        ...(approverIds.length ? [{ approver: { $in: approverIds } }] : []),
      ];
    }

    // Fetch data
    let expenses = await Expense.find(query)
      .populate('employeeId', 'name employeeCode email')
      .populate('approver', 'name employeeCode email')
      .populate('comments.commentBy', 'name employeeCode email')
      .sort({ [sortBy]: parseInt(sortValue) })
      .skip(skip)
      .limit(limit);

    // Reverse comments per expense
    expenses = expenses.map((expense) => {
      const exp = expense.toObject();
      exp.comments = (exp.comments || []).slice().reverse(); // latest comments first
      return exp;
    });

    const [count, totalCount, statusCounts] = await Promise.all([
      Expense.countDocuments(query),
      Expense.countDocuments({
        companyId: req.admin.companyId,
        plantId: req.params.plantId,
      }),
      Expense.aggregate([
        {
          $match: {
            companyId: req.admin.companyId,
            plantId: new mongoose.Types.ObjectId(req.params.plantId),
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Build status summary
    const statusSummary = {
      under_review: 0,
      claimed: 0,
      rejected: 0,
      totalAmount: 0,
      claimedAmount: 0,
      remainingAmount: 0,
    };

    statusCounts.forEach(({ _id, count, totalAmount }) => {
      if (_id === 'under review') {
        statusSummary.under_review = count;
        statusSummary.totalAmount += totalAmount; // Include under review in total
      }
      if (_id === 'claimed') {
        statusSummary.claimed = count;
        statusSummary.claimedAmount = totalAmount;
        statusSummary.totalAmount += totalAmount; // Include claimed in total
      }
      if (_id === 'rejected') {
        statusSummary.rejected = count;
        // Do not include rejected expenses in totalAmount
      }
    });

    statusSummary.remainingAmount = statusSummary.totalAmount - statusSummary.claimedAmount;

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    return res.status(200).json({
      success: true,
      result: expenses,
      summary: {
        total: totalCount,
        ...statusSummary,
      },
      pagination,
      message: 'Successfully retrieved expenses',
    });
  } catch (err) {
    console.error('Error in getExpenses:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { expenseId } = req.params;
    const companyId = req.admin.companyId;
    const userId = req.admin.id;
    const { category, subCategory, status, formData, comment, plantId } = req.body;

    const updateFields = {
      lastModifiedAt: new Date(),
    };

    if (category) updateFields.category = category;
    if (subCategory) updateFields.subCategory = subCategory;
    if (formData) {
      updateFields.formData = typeof formData === 'string' ? JSON.parse(formData) : formData;
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      companyId,
      plantId,
    }).session(session);

    if (!expense) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Expense not found for the given company and plant',
      });
    }

    // Check if status is being changed to 'rejected' and expense had wallet deduction
    const isBeingRejected = status === 'rejected' && expense.status !== 'rejected';
    const hadWalletDeduction = expense.walletDeducted;

    // Handle wallet refund for rejected expenses
    if (isBeingRejected && hadWalletDeduction) {
      // Find the original wallet transaction for this expense
      const originalTransaction = await WalletTransaction.findOne({
        relatedExpenseId: expenseId,
        transactionType: 'debit',
        status: 'completed',
      }).session(session);

      if (originalTransaction) {
        // Find the employee whose wallet was debited
        const employee = await User.findById(originalTransaction.employeeId).session(session);

        if (employee) {
          const currentBalance = employee.walletBalance || 0;
          const refundAmount = originalTransaction.amount;
          const newBalance = currentBalance + refundAmount;

          // Update employee wallet balance
          await User.findByIdAndUpdate(
            originalTransaction.employeeId,
            {
              walletBalance: newBalance,
              lastWalletUpdate: new Date(),
            },
            { session }
          );

          // Create refund transaction record
          const refundTransaction = new WalletTransaction({
            companyId,
            plantId,
            employeeId: originalTransaction.employeeId,
            transactionType: 'credit',
            amount: refundAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Refund for rejected expense - ${expense.category}${
              expense.subCategory ? ` (${expense.subCategory})` : ''
            }`,
            relatedExpenseId: expenseId,
            processedBy: userId,
            status: 'completed',
          });

          await refundTransaction.save({ session });

          // Mark the expense as refunded
          expense.walletRefunded = true;
        }
      }
    }

    // Update expense status if provided
    if (status) updateFields.status = status;

    // Update fields
    Object.assign(expense, updateFields);

    // Append files if uploaded
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map((file) => file.path);
      expense.files.push(...uploadedUrls);
    }

    // Add comment if provided
    if (comment && comment.trim()) {
      expense.comments.push({
        comment: comment.trim(),
        commentBy: userId,
      });
    }

    await expense.populate([
      { path: 'employeeId', select: 'employeeCode email name' },
      { path: 'comments.commentBy', select: 'employeeCode email' },
    ]);

    await expense.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message:
        isBeingRejected && hadWalletDeduction
          ? 'Expense rejected and wallet balance refunded successfully'
          : 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during update',
    });
  } finally {
    session.endSession();
  }
};

exports.addComment = async (req, res) => {
  try {
    const { expenseId, comment, plantId } = req.body;
    const companyId = req.admin.companyId;

    if (!expenseId || !comment || !plantId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Update and fetch in one call
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: expenseId, companyId },
      {
        $push: {
          comments: {
            comment,
            date: new Date(),
            commentBy: req.admin?.id || null,
          },
        },
      },
      { new: true }
    ).populate('comments.commentBy', 'employeeCode email');

    if (!updatedExpense) {
      return res
        .status(404)
        .json({ success: false, message: 'Expense not found or company mismatch' });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment added',
      comments: updatedExpense.comments.reverse(), // Optional: latest first
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get detailed employee expense summary (Admin/Owner only)
exports.getEmployeeExpenseSummary = async (req, res) => {
  try {
    const { plantId } = req.params;
    const companyId = req.admin.companyId;
    const { startDate, endDate } = req.query;

    // Check if user has permission (admin/owner only)
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can view employee expense summaries',
      });
    }

    // Get all employees for this plant
    const employees = await User.find({
      companyId,
      plantId,
      role: 'employee',
      removed: false,
    }).select('name employeeCode walletBalance walletStatus lastWalletUpdate email');

    if (!employees.length) {
      return res.status(200).json({
        success: true,
        message: 'No employees found for this plant',
        data: [],
      });
    }

    // Build date filter for expenses and transactions
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    // Get expense summaries for all employees
    const expenseSummaries = await Promise.all(
      employees.map(async (employee) => {
        // Get expense statistics
        const [expenseStats, walletTransactions, recentExpenses] = await Promise.all([
          // Expense statistics aggregation
          Expense.aggregate([
            {
              $match: {
                companyId,
                plantId: new mongoose.Types.ObjectId(plantId),
                employeeId: employee._id,
                ...dateFilter,
              },
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
              },
            },
          ]),

          // Wallet transactions
          WalletTransaction.find({
            companyId,
            plantId,
            employeeId: employee._id,
            ...(startDate &&
              endDate && {
                createdAt: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate + 'T23:59:59.999Z'),
                },
              }),
          })
            .populate('relatedExpenseId', 'category amount status')
            .sort({ createdAt: -1 })
            .limit(10),

          // Recent expenses (last 5)
          Expense.find({
            companyId,
            plantId,
            employeeId: employee._id,
            ...dateFilter,
          })
            .sort({ submittedAt: -1 })
            .limit(5)
            .select('category subCategory amount status submittedAt walletDeducted'),
        ]);

        // Process expense statistics
        const stats = {
          total: 0,
          under_review: 0,
          claimed: 0,
          rejected: 0,
          totalAmount: 0,
          claimedAmount: 0,
          rejectedAmount: 0,
          reviewAmount: 0,
        };

        expenseStats.forEach(({ _id, count, totalAmount }) => {
          stats.total += count;
          // Only include non-rejected expenses in totalAmount
          if (_id !== 'rejected') {
            stats.totalAmount += totalAmount;
          }

          if (_id === 'under review') {
            stats.under_review = count;
            stats.reviewAmount = totalAmount;
          } else if (_id === 'claimed') {
            stats.claimed = count;
            stats.claimedAmount = totalAmount;
          } else if (_id === 'rejected') {
            stats.rejected = count;
            stats.rejectedAmount = totalAmount;
          }
        });

        // Process wallet transaction statistics
        const walletStats = {
          totalCredits: 0,
          totalDebits: 0,
          creditCount: 0,
          debitCount: 0,
          lastTransaction: null,
        };

        walletTransactions.forEach((transaction) => {
          if (transaction.transactionType === 'credit') {
            walletStats.totalCredits += transaction.amount;
            walletStats.creditCount++;
          } else if (transaction.transactionType === 'debit') {
            walletStats.totalDebits += transaction.amount;
            walletStats.debitCount++;
          }
        });

        if (walletTransactions.length > 0) {
          walletStats.lastTransaction = walletTransactions[0];
        }

        return {
          employee: {
            _id: employee._id,
            name: employee.name,
            employeeCode: employee.employeeCode,
            email: employee.email,
            walletBalance: employee.walletBalance || 0,
            walletStatus: employee.walletStatus || 'active',
            lastWalletUpdate: employee.lastWalletUpdate,
          },
          expenseStats: stats,
          walletStats,
          recentExpenses,
          recentTransactions: walletTransactions.slice(0, 5), // Last 5 transactions
        };
      })
    );

    // Sort by total expense amount (highest first)
    expenseSummaries.sort((a, b) => b.expenseStats.totalAmount - a.expenseStats.totalAmount);

    // Calculate overall summary
    const overallSummary = expenseSummaries.reduce(
      (acc, emp) => {
        acc.totalEmployees++;
        acc.totalExpenses += emp.expenseStats.total;
        acc.totalExpenseAmount += emp.expenseStats.totalAmount;
        acc.totalWalletBalance += emp.employee.walletBalance;
        acc.totalCredits += emp.walletStats.totalCredits;
        acc.totalDebits += emp.walletStats.totalDebits;

        if (emp.employee.walletStatus === 'active') acc.activeWallets++;
        if (emp.employee.walletStatus === 'suspended') acc.suspendedWallets++;

        return acc;
      },
      {
        totalEmployees: 0,
        totalExpenses: 0,
        totalExpenseAmount: 0,
        totalWalletBalance: 0,
        totalCredits: 0,
        totalDebits: 0,
        activeWallets: 0,
        suspendedWallets: 0,
      }
    );

    res.status(200).json({
      success: true,
      data: expenseSummaries,
      summary: overallSummary,
      message: 'Employee expense summaries retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching employee expense summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee expense summaries',
    });
  }
};

// Export individual employee expenses to Excel
exports.exportEmployeeExpenses = async (req, res) => {
  try {
    const { plantId, employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const companyId = req.admin.companyId;

    // Check if user has permission (admin/owner only)
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can export employee expenses',
      });
    }

    // Get employee details
    const employee = await User.findOne({
      _id: employeeId,
      companyId,
      plantId,
      role: 'employee',
      removed: false,
    }).select('name employeeCode email walletBalance walletStatus');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    // Get expenses and transactions
    const [expenses, transactions] = await Promise.all([
      Expense.find({
        companyId,
        plantId,
        employeeId,
        ...dateFilter,
      }).sort({ submittedAt: -1 }),

      WalletTransaction.find({
        companyId,
        plantId,
        employeeId,
        ...(startDate &&
          endDate && {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate + 'T23:59:59.999Z'),
            },
          }),
      })
        .populate('relatedExpenseId', 'category amount')
        .sort({ createdAt: -1 }),
    ]);

    // Prepare expenses data for Excel
    const expensesData = expenses.map((expense) => ({
      Date: new Date(expense.submittedAt).toLocaleDateString(),
      Category: expense.category,
      'Sub Category': expense.subCategory || '',
      Amount: expense.amount,
      Status: expense.status,
      'Wallet Deducted': expense.walletDeducted ? 'Yes' : 'No',
      'Wallet Refunded': expense.walletRefunded ? 'Yes' : 'No',
      'Last Modified': new Date(expense.lastModifiedAt).toLocaleDateString(),
    }));

    // Prepare transactions data for Excel
    const transactionsData = transactions.map((transaction) => ({
      Date: new Date(transaction.createdAt).toLocaleDateString(),
      Type: transaction.transactionType.toUpperCase(),
      Amount: transaction.amount,
      'Balance Before': transaction.balanceBefore,
      'Balance After': transaction.balanceAfter,
      Description: transaction.description,
      Status: transaction.status,
      'Related Expense': transaction.relatedExpenseId?.category || 'N/A',
    }));

    // Summary data
    const summaryData = [
      ['Employee Summary', ''],
      ['Name', employee.name],
      ['Employee Code', employee.employeeCode],
      ['Email', employee.email],
      ['Current Wallet Balance', employee.walletBalance],
      ['Wallet Status', employee.walletStatus],
      ['Total Expenses', expenses.length],
      [
        'Total Expense Amount',
        expenses
          .filter((exp) => exp.status !== 'rejected')
          .reduce((sum, exp) => sum + exp.amount, 0),
      ],
      ['Claimed Expenses', expenses.filter((exp) => exp.status === 'claimed').length],
      ['Under Review', expenses.filter((exp) => exp.status === 'under review').length],
      ['Rejected Expenses', expenses.filter((exp) => exp.status === 'rejected').length],
      ['Export Date', new Date().toLocaleDateString()],
      ['Date Range', startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'],
    ];

    // Create workbook
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add expenses sheet
    if (expensesData.length > 0) {
      const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
    }

    // Add transactions sheet
    if (transactionsData.length > 0) {
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `${employee.name}_Expenses_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error exporting employee expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting employee expenses',
    });
  }
};

// Export dashboard expenses with transaction filters to Excel
exports.exportDashboardExpenses = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { startDate, endDate, status, category } = req.query;
    const companyId = req.admin.companyId;

    // Check if user has permission (admin/owner only)
    if (req.admin.role !== 'admin' && req.admin.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or owner can export dashboard expenses',
      });
    }

    // Build query filters
    const query = { companyId, plantId };

    if (startDate && endDate) {
      query.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    if (status && status !== 'total') {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    // Get expenses with employee details
    const expenses = await Expense.find(query)
      .populate('employeeId', 'name employeeCode email')
      .populate('approver', 'name employeeCode')
      .sort({ submittedAt: -1 });

    // Get all employees for the plant
    const employees = await User.find({
      companyId,
      plantId,
      role: 'employee',
      removed: false,
    }).select('name employeeCode walletBalance walletStatus');

    // Get all transactions for the plant with filters
    const transactionQuery = { companyId, plantId };
    if (startDate && endDate) {
      transactionQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const transactions = await WalletTransaction.find(transactionQuery)
      .populate('employeeId', 'name employeeCode')
      .populate('relatedExpenseId', 'category amount status')
      .sort({ createdAt: -1 });

    // Prepare expenses data
    const expensesData = expenses.map((expense) => ({
      'Employee Name': expense.employeeId?.name || 'N/A',
      'Employee Code': expense.employeeId?.employeeCode || 'N/A',
      Category: expense.category,
      'Sub Category': expense.subCategory || '',
      Amount: expense.amount,
      Status: expense.status,
      'Wallet Deducted': expense.walletDeducted ? 'Yes' : 'No',
      'Wallet Refunded': expense.walletRefunded ? 'Yes' : 'No',
      'Submitted At': new Date(expense.submittedAt).toLocaleDateString(),
      Approver: expense.approver?.name || 'N/A',
    }));

    // Prepare employees summary
    const employeesData = employees.map((employee) => ({
      Name: employee.name,
      'Employee Code': employee.employeeCode,
      'Wallet Balance': employee.walletBalance,
      'Wallet Status': employee.walletStatus,
      'Total Expenses': expenses.filter(
        (exp) => exp.employeeId?._id.toString() === employee._id.toString()
      ).length,
      'Total Amount': expenses
        .filter(
          (exp) =>
            exp.employeeId?._id.toString() === employee._id.toString() && exp.status !== 'rejected'
        )
        .reduce((sum, exp) => sum + exp.amount, 0),
    }));

    // Prepare transactions data
    const transactionsData = transactions.map((transaction) => ({
      'Employee Name': transaction.employeeId?.name || 'N/A',
      'Employee Code': transaction.employeeId?.employeeCode || 'N/A',
      Date: new Date(transaction.createdAt).toLocaleDateString(),
      Type: transaction.transactionType.toUpperCase(),
      Amount: transaction.amount,
      'Balance Before': transaction.balanceBefore,
      'Balance After': transaction.balanceAfter,
      Description: transaction.description,
      Status: transaction.status,
    }));

    // Summary statistics
    const summaryData = [
      ['Dashboard Summary', ''],
      ['Plant ID', plantId],
      ['Total Employees', employees.length],
      ['Total Expenses', expenses.length],
      [
        'Total Expense Amount',
        expenses
          .filter((exp) => exp.status !== 'rejected')
          .reduce((sum, exp) => sum + exp.amount, 0),
      ],
      ['Claimed Expenses', expenses.filter((exp) => exp.status === 'claimed').length],
      ['Under Review', expenses.filter((exp) => exp.status === 'under review').length],
      ['Rejected Expenses', expenses.filter((exp) => exp.status === 'rejected').length],
      ['Total Wallet Balance', employees.reduce((sum, emp) => sum + (emp.walletBalance || 0), 0)],
      ['Total Transactions', transactions.length],
      ['Export Date', new Date().toLocaleDateString()],
      ['Date Range', startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'],
      ['Status Filter', status || 'All'],
      ['Category Filter', category || 'All'],
    ];

    // Create workbook
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add expenses sheet
    if (expensesData.length > 0) {
      const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
    }

    // Add employees sheet
    if (employeesData.length > 0) {
      const employeesSheet = XLSX.utils.json_to_sheet(employeesData);
      XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Employees');
    }

    // Add transactions sheet
    if (transactionsData.length > 0) {
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Dashboard_Expenses_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error exporting dashboard expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting dashboard expenses',
    });
  }
};
