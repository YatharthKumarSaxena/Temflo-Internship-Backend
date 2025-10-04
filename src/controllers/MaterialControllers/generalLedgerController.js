const GeneralLedger = require('../../models/MaterialModels/GeneralLedgerModel');
const { GENERAL_LEDGER_DELETED, GENERAL_LEDGER_CREATED, GENERAL_LEDGER_UPDATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

class GeneralLedgerController {
  // Create new general ledger account
  async createGeneralLedger(req, res) {
    try {
      const glData = {
        ...req.body,
        createdBy: req.admin._id,
      };

      const generalLedger = new GeneralLedger(glData);
      await generalLedger.save();

      const populatedGL = await GeneralLedger.findById(generalLedger._id).populate(
        'createdBy',
        'name email'
      );

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_generalLedger,
        modelAffected: [MODEL_AFFECTED.model_GeneralLedger],
        eventType: GENERAL_LEDGER_CREATED,
        actionDone: ACTIONS.create,
        oldData: null, // ✅ Correct for creation
        newData: generalLedger.toObject(), // ✅ Complete snapshot
        description: `General Ledger account '${generalLedger.accountCode}' created by ${getFullName(req.admin.employeeInfo)}`
      });

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
      // Get old data before update
      const existingRecord = await GeneralLedger.findById(req.params.id);

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'General Ledger account not found',
        });
      }

      // Store original data before modification
      const originalData = existingRecord.toObject();

      const updateData = {
        ...req.body,
        updatedBy: req.admin._id,
      };

      // Update using save method to avoid extra DB calls
      Object.assign(existingRecord, updateData);
      await existingRecord.save();

      const populatedGL = await GeneralLedger.findById(existingRecord._id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_generalLedger,
        modelAffected: [MODEL_AFFECTED.model_GeneralLedger],
        eventType: GENERAL_LEDGER_UPDATED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before update
        newData: existingRecord.toObject(), // ✅ Complete snapshot after update
        description: `General Ledger account '${existingRecord.accountCode}' updated by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'General Ledger account updated successfully',
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

  // Delete general ledger account
  async deleteGeneralLedger(req, res) {
    try {
      const generalLedger = await GeneralLedger.findById(req.params.id);

      if (!generalLedger) {
        return res.status(404).json({
          success: false,
          message: 'General Ledger account not found',
        });
      }

      // Get old data before delete
      const oldData = generalLedger.toObject();

      // Hard delete (not soft delete)
      await GeneralLedger.findByIdAndDelete(req.params.id);

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_generalLedger,
        modelAffected: [MODEL_AFFECTED.model_GeneralLedger],
        eventType: GENERAL_LEDGER_DELETED,
        actionDone: ACTIONS.delete,
        oldData: oldData, // ✅ Complete snapshot before delete
        newData: null,
        description: `General Ledger account '${oldData.accountCode}' deleted by ${getFullName(req.admin.employeeInfo)}`
      });

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
