const Expense = require('../../models/expenseModels/expense')
const ExpensePolicy = require('../../models/expenseModels/expensePolicy')
const mongoose = require('mongoose');
const User = require('../../models/userModels/User')

exports.createExpenseCategory = async (req, res) => {
    try {
      const { expenseCategory, subCategories, plantId } = req.body;
  
      if (!expenseCategory || !plantId) {
        return res.status(400).json({ success: false, message: "Expense Category and Plant ID are required." });
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
        return res.status(400).json({ success: false, message: "Plant ID is required" });
      }
  
      const expenseCategoryRecord = await ExpensePolicy.findOne({ companyId, plantId });
  
      if (!expenseCategoryRecord || !expenseCategoryRecord.expensePolicies.length) {
        return res.status(200).json({ success: true, message: 'No expense category found for this plant', expensePolicies: [] });
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
        return res.status(400).json({ success: false, message: "Plant ID is required" });
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
        return res.status(400).json({ success: false, message: "Plant ID is required" });
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
      console.log(err);
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
        return res.status(400).json({ success: false, message: 'No Expense Category found for this plant' });
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
        return res.status(400).json({ success: false, message: 'No Expense Category found for this plant' });
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
  


  exports.claimExpense = async (req, res) => {
    try {
      const {
        plantId,
        employeeId,
        category,
        subCategory,
        amount,
        formData: formDataRaw,
      } = req.body;

      const companyId = req.admin.companyId
  
      // Parse formData string (from form-data payload)
      let formData;
      try {
        formData = typeof formDataRaw === 'string' ? JSON.parse(formDataRaw) : formDataRaw;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid formData JSON' });
      }
  
      // Get uploaded file URLs from Cloudinary
      const fileUrls = req.files?.map((file) => file.path) || [];
  
      if (!amount || !fileUrls.length) {
        return res.status(400).json({
          success: false,
          message: 'Amount and at least one file are required',
        });
      }
  
      const newExpense = new Expense({
        employeeId,
        companyId,
        plantId,
        category,
        subCategory,
        amount,
        files: fileUrls,
        formData,
      });
  
      await newExpense.save();
  
      res.status(200).json({
        success: true,
        message: 'Your expense submitted successfully!',
        expenseRecord: newExpense,
      });
    } catch (error) {
      console.error(error);
      return next(ErrorHandler.internalServer('Error while submitting your expense.'));
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
        .populate('employeeId', 'employeeCode email')
        .populate('approver', 'employeeCode email')
        .populate('comments.commentBy', 'employeeCode email')
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
        if (_id === 'under review') statusSummary.under_review = count;
        if (_id === 'claimed') {
          statusSummary.claimed = count;
          statusSummary.claimedAmount = totalAmount;
        }
        if (_id === 'rejected') statusSummary.rejected = count;
        statusSummary.totalAmount += totalAmount;
      });
  
      statusSummary.remainingAmount =
        statusSummary.totalAmount - statusSummary.claimedAmount;
  
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
    try {
      const { expenseId } = req.params;
      const companyId = req.admin.companyId;
      const userId = req.admin.id;
      const {
        category,
        subCategory,
        status,
        formData,
        comment,
        plantId,
      } = req.body;
  
      const updateFields = {
        lastModifiedAt: new Date(),
      };
  
      if (category) updateFields.category = category;
      if (subCategory) updateFields.subCategory = subCategory;
      if (status) updateFields.status = status;
      if (formData) {
        updateFields.formData = typeof formData === 'string' ? JSON.parse(formData) : formData;
      }
  
      const expense = await Expense.findOne({
        _id: expenseId,
        companyId,
        plantId,
      });
  
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found for the given company and plant',
        });
      }
  
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
        { path: 'employeeId', select: 'employeeCode email' },
        { path: 'comments.commentBy', select: 'employeeCode email' },
      ]);
  
      await expense.save();
  
      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        expense,
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during update',
      });
    }
  };


  exports.addComment = async (req,res) =>{
    try {
        const { expenseId, comment, plantId} = req.body;
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
          return res.status(404).json({ success: false, message: 'Expense not found or company mismatch' });
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
  }