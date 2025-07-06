const Expense = require('../../models/expenseModels/expense')
const ExpensePolicy = require('../../models/expenseModels/expensePolicy')


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
  


  