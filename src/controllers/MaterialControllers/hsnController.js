const HSNCode = require('../../models/MaterialModels/HSNCodeModel');
const { HSN_CREATED, HSN_DELETED, HSN_UPDATED, HSN_BULK_CREATED } = require("@/config/activity.enums");
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");

class HSNController {
  // Create new HSN code
  async createHSNCode(req, res) {
    try {
      const hsnData = {
        ...req.body,
        companyId: req.admin.companyId,
        createdBy: req.admin._id,
      };

      // Ensure default toDate if not provided
      if (!hsnData.toDate) {
        hsnData.toDate = new Date('9999-12-31T00:00:00.000Z');
      }

      const hsnCode = new HSNCode(hsnData);
      await hsnCode.save();

      const populatedHSN = await HSNCode.findById(hsnCode._id).populate('createdBy', 'name email');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_hsn,
        modelAffected: [MODEL_AFFECTED.model_Hsn],
        eventType: HSN_CREATED,
        actionDone: ACTIONS.create,
        oldData: null, // ✅ Correct for creation
        newData: hsnCode.toObject(), // ✅ Complete snapshot
        description: `HSN Code '${hsnCode.hsnCode}' created by ${getFullName(req.admin.employeeInfo)}`
      });

      res.status(201).json({
        success: true,
        message: 'HSN Code created successfully',
        data: populatedHSN,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'HSN Code already exists',
        });
      }
      if (error.message && error.message.includes('overlapping validity period')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  // Get all HSN codes with pagination and filters
  async getHSNCodes(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status } = req.query;

      const query = { companyId: req.admin.companyId };

      // Search filter
      if (search) {
        query.$or = [
          { hsnCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      const hsnCodes = await HSNCode.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ hsnCode: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await HSNCode.countDocuments(query);

      res.json({
        success: true,
        data: hsnCodes,
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

  // Get HSN code by ID
  async getHSNCodeById(req, res) {
    try {
      const hsnCode = await HSNCode.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!hsnCode) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      res.json({
        success: true,
        data: hsnCode,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update HSN code
  async updateHSNCode(req, res) {
    try {
      // Get old data before update
      const existingRecord = await HSNCode.findById(req.params.id);

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      // Store original data before modification
      const originalData = existingRecord.toObject();

      const updateData = {
        ...req.body,
        updatedBy: req.admin._id,
      };

      // Normalize toDate default if explicitly cleared
      if (Object.prototype.hasOwnProperty.call(req.body, 'toDate') && !req.body.toDate) {
        updateData.toDate = new Date('9999-12-31T00:00:00.000Z');
      }

      // Update using save method to avoid extra DB calls
      Object.assign(existingRecord, updateData);
      await existingRecord.save();

      const populatedHSN = await HSNCode.findById(existingRecord._id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_hsn,
        modelAffected: [MODEL_AFFECTED.model_Hsn],
        eventType: HSN_UPDATED,
        actionDone: ACTIONS.update,
        oldData: originalData, // ✅ Original data before update
        newData: existingRecord.toObject(), // ✅ Complete snapshot after update
        description: `HSN Code '${existingRecord.hsnCode}' updated by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'HSN Code updated successfully',
        data: populatedHSN,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'HSN Code already exists',
        });
      }
      if (error.message && error.message.includes('overlapping validity period')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  // Delete HSN code
  async deleteHSNCode(req, res) {
    try {
      const hsnCode = await HSNCode.findById(req.params.id);

      if (!hsnCode) {
        return res.status(404).json({
          success: false,
          message: 'HSN Code not found',
        });
      }

      // Get old data before delete
      const oldData = hsnCode.toObject();

      // Hard delete (not soft delete)
      await HSNCode.findByIdAndDelete(req.params.id);

      // ---- ACTIVITY TRACKER ----
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.material,
        subModuleAffected: null,
        fileAffected: FILE.file_hsn,
        modelAffected: [MODEL_AFFECTED.model_Hsn],
        eventType: HSN_DELETED,
        actionDone: ACTIONS.delete,
        oldData: oldData, // ✅ Complete snapshot before delete
        newData: null,
        description: `HSN Code '${oldData.hsnCode}' deleted by ${getFullName(req.admin.employeeInfo)}`
      });

      res.json({
        success: true,
        message: 'HSN Code deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN codes for dropdown (active only)
  async getHSNCodesDropdown(req, res) {
    try {
      const hsnCodes = await HSNCode.find({ companyId: req.admin.companyId, status: 'active' })
        .select('hsnCode description gstRate category')
        .sort({ hsnCode: 1 });

      res.json({
        success: true,
        data: hsnCodes,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN codes by category
  async getHSNCodesByCategory(req, res) {
    try {
      const { category } = req.params;
      const hsnCodes = await HSNCode.find({
        companyId: req.admin.companyId,
        category,
        status: 'active',
      })
        .select('hsnCode description gstRate')
        .sort({ hsnCode: 1 });

      res.json({
        success: true,
        data: hsnCodes,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get HSN code statistics
  async getHSNStats(req, res) {
    try {
      const totalHSNCodes = await HSNCode.countDocuments({ companyId: req.admin.companyId });
      const activeHSNCodes = await HSNCode.countDocuments({
        companyId: req.admin.companyId,
        status: 'active',
      });
      const inactiveHSNCodes = await HSNCode.countDocuments({
        companyId: req.admin.companyId,
        status: 'inactive',
      });

      // Category-wise count
      const categoryStats = await HSNCode.aggregate([
        { $match: { companyId: req.admin.companyId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      // GST Rate-wise count
      const gstRateStats = await HSNCode.aggregate([
        { $match: { companyId: req.admin.companyId } },
        {
          $group: {
            _id: '$gstRate',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          total: totalHSNCodes,
          active: activeHSNCodes,
          inactive: inactiveHSNCodes,
          categoryStats,
          gstRateStats,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Bulk import HSN codes
  async bulkImportHSNCodes(req, res) {
    try {
      const { hsnCodes } = req.body;

      if (!Array.isArray(hsnCodes) || hsnCodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'HSN codes array is required',
        });
      }

      const results = [];
      const errors = [];

      for (const hsnData of hsnCodes) {
        try {
          const hsnCode = new HSNCode({
            ...hsnData,
            companyId: req.admin.companyId,
            createdBy: req.admin._id,
          });
          await hsnCode.save();

          // ---- ACTIVITY TRACKER ----
          activityTracker({
            userId: req.admin._id,
            companyId: req.admin.companyId,
            plantId: req.admin.plantId || null,
            module: MODULE.material,
            subModuleAffected: null,
            fileAffected: FILE.file_hsn,
            modelAffected: [MODEL_AFFECTED.model_Hsn],
            eventType: HSN_BULK_CREATED,
            actionDone: ACTIONS.create,
            oldData: null, // ✅ Correct for creation
            newData: hsnCode.toObject(), // ✅ Complete snapshot
            description: `HSN Code '${hsnCode.hsnCode}' created by ${getFullName(req.admin.employeeInfo)} during bulk import`
          });

          results.push(hsnCode);
        } catch (error) {
          errors.push({
            hsnCode: hsnData.hsnCode,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Imported ${results.length} HSN codes successfully`,
        data: {
          imported: results.length,
          errors: errors.length,
          errorDetails: errors,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new HSNController();
