const GeneralLedger = require('../../models/MaterialModels/GeneralLedgerModel');

class GeneralLedgerController {
  // Create new general ledger account
  async createGeneralLedger(req, res) {
    try {
      const glData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const generalLedger = new GeneralLedger(glData);
      await generalLedger.save();

      const populatedGL = await GeneralLedger.findById(generalLedger._id).populate(
        'createdBy',
        'name email'
      );

      res.status(201).json({
        success: true,
        message: 'General Ledger account created successfully',
        data: populatedGL,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Account code already exists',
        });
      }
      throw error;
    }
  }

  // Get all general ledger accounts with pagination and filters
  async getGeneralLedgerAccounts(req, res) {
    try {
      const { page = 1, limit = 10, search, accountType, category, isActive } = req.query;

      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { accountCode: { $regex: search, $options: 'i' } },
          { accountName: { $regex: search, $options: 'i' } },
        ];
      }

      // Account type filter
      if (accountType) {
        query.accountType = accountType;
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Active status filter
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const generalLedgerAccounts = await GeneralLedger.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ accountCode: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await GeneralLedger.countDocuments(query);

      res.json({
        success: true,
        data: generalLedgerAccounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get general ledger account by ID
  async getGeneralLedgerById(req, res) {
    try {
      const generalLedger = await GeneralLedger.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!generalLedger) {
        return res.status(404).json({
          success: false,
          message: 'General Ledger account not found',
        });
      }

      res.json({
        success: true,
        data: generalLedger,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update general ledger account
  async updateGeneralLedger(req, res) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const generalLedger = await GeneralLedger.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!generalLedger) {
        return res.status(404).json({
          success: false,
          message: 'General Ledger account not found',
        });
      }

      res.json({
        success: true,
        message: 'General Ledger account updated successfully',
        data: generalLedger,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Account code already exists',
        });
      }
      throw error;
    }
  }

  // Delete general ledger account
  async deleteGeneralLedger(req, res) {
    try {
      const generalLedger = await GeneralLedger.findByIdAndDelete(req.params.id);

      if (!generalLedger) {
        return res.status(404).json({
          success: false,
          message: 'General Ledger account not found',
        });
      }

      res.json({
        success: true,
        message: 'General Ledger account deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get general ledger accounts for dropdown (active only)
  async getGeneralLedgerDropdown(req, res) {
    try {
      const generalLedgerAccounts = await GeneralLedger.find({ isActive: true })
        .select('accountCode accountName accountType category')
        .sort({ accountCode: 1 });

      res.json({
        success: true,
        data: generalLedgerAccounts,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get general ledger accounts by type
  async getGeneralLedgerByType(req, res) {
    try {
      const { accountType } = req.params;
      const generalLedgerAccounts = await GeneralLedger.find({
        accountType,
        isActive: true,
      })
        .select('accountCode accountName category')
        .sort({ accountCode: 1 });

      res.json({
        success: true,
        data: generalLedgerAccounts,
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new GeneralLedgerController();
